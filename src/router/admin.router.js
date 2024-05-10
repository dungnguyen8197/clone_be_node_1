const router = require('./extensions').Router();
const models = router.models;
let fetch = require('node-fetch');

const { convertTimeStamp } = require('../lib/formatData');
const {generateToken, generateRefreshToken, generateTokenOnRefresh} = require('../lib/token');
const { isEmpty } = require('../lib/validate');
const { ThrowReturn } = require('./extensions');
const { OTP_URL, URL_LOGIN } = require('../../config/setting');
const { Op } = require('sequelize');
const adminLevel = require('../constant/adminLevel');
const { callOtherService, callApiLogin } = require('../lib/signature');
const UpdateBoss = require('../utils/updateBoss')
const redisPool = require('../utils/redispool');

UpdateBoss()

const levelAdmin = {1: 'boss', 2: 'super_admin_id', 3: 'admin_id', 4: 'super_agent_id', 5: 'agent_id', 6: 'client_id'};

const create = async (req, res) => {
    const {currentAdmin} = req;
    let {phone, roles, user_name, is_active} = req.body;
    // validate input data
    if (isEmpty(phone) || isEmpty(roles)) throw new ThrowReturn('Invalid input data');
	const [allRole, currentAdminRoles] = await Promise.all([
        models.Role.findAll({
            where: {id: {[Op.or]: roles.map((r) => r.role_id)}},
            raw: true
        }),
        models.AdminCm.findAll({
            where: {id: currentAdmin.id},
            attributes: ['roles.level', 'roles.type_services'],
            include: {model: models.Role, through: {attributes: []}, attributes: [], as: 'roles'},
            raw: true
        })
    ]);
	// validate unique type service
    uniqueTypeService = [];
    allRole.forEach((t) => {
        if (uniqueTypeService.includes(t.type_services))
            throw new ThrowReturn('Only one role is allowed per type service');
        uniqueTypeService = [...uniqueTypeService, t.type_services];
    });
	// validate role level
    if (!currentAdminRoles.map((l) => l.level).includes(adminLevel.Boss)) {
        allRole.forEach((ar) => {
            let hasRoles = false;
            currentAdminRoles.forEach((cr) => {
                if (ar.type_services === cr.type_services) {
                    hasRoles = true;
                    if (ar.level <= cr.level) throw new ThrowReturn("Admin doesn't have enough role level");
                }
            });
            if (!hasRoles) throw new ThrowReturn("Admin doesn't have this role");
        });
    }
    // create admin
    const newAdmin = await models.AdminCm.findOrCreate({
        where: {phone},
        defaults: {user_name, phone, is_active},
        raw: true
    });
    if (!newAdmin[1]) throw new ThrowReturn('Số điện thoại đã tồn tại');
    // create role
    for (const r of roles) {
		const [inputRole, initPermission] = await Promise.all([
            models.Role.findByPk(r.role_id, {raw: true}),
            models.RoleHasPermission.findAll({where: {role_id: r.role_id}, raw: true})
        ]);
        const parentAdmin = await models.AdminCm.findOne({
            where: {id: !isEmpty(r.parent_id) ? r.parent_id : currentAdmin.id},
            attributes: [
                'id',
                'admin_has_role.level_super_admin_id',
                'admin_has_role.level_admin_id',
                'admin_has_role.level_super_agent_id',
                'admin_has_role.level_agent_id',
                'admin_has_role.type_services'
            ],
            include: {
                model: models.AdminHasRole,
                as: 'admin_has_role',
                attributes: [],
                where: {
                    [Op.and]: [
                        {type_services: {[Op.or]: [inputRole.type_services, 0]}},
                        !isEmpty(r.parent_id) ? {level: inputRole.level - 1} : {}
                    ]
                },
                required: true
            },
            raw: true
        });
        let dataAdminHasRole = {
            admin_id: newAdmin[0].dataValues.id,
            role_id: r.role_id,
            admin_type: 'App\\Model',
            parent_id: parentAdmin?.id,
            level_super_admin_id: parentAdmin?.level_super_admin_id,
            level_admin_id: parentAdmin?.level_admin_id,
            level_super_agent_id: parentAdmin?.level_super_agent_id,
            level_agent_id: parentAdmin?.level_agent_id,
            level: inputRole.level,
            type_services: inputRole.type_services,
            discount: r.discount,
            discount_by_id: parentAdmin?.id,
            list_agent_id: r.list_agent_id,
            list_super_agent_id: r.list_super_agent_id
        };
        let parentLevel = 'level_' + levelAdmin[inputRole.level <= 2 ? inputRole.level : inputRole.level - 1];
        dataAdminHasRole[parentLevel] = dataAdminHasRole.parent_id;
        await models.AdminHasRole.findOrCreate({
            where: {[Op.and]: [{admin_id: newAdmin[0].dataValues.id}, {role_id: r.role_id}]},
            defaults: dataAdminHasRole
        });
        // create permission by role
        await Promise.all(
            initPermission.map((p) => {
                return new Promise((resolve) => {
                    models.AdminRolePermission.findOrCreate({
                        where: {
                            admin_id: newAdmin[0].dataValues.id,
                            role_id: r.role_id,
                            permission_id: p.permission_id
                        },
                        defaults: {
                            admin_id: newAdmin[0].dataValues.id,
                            role_id: r.role_id,
                            permission_id: p.permission_id
                        }
                    }).then(() => resolve());
                });
            })
        );
    }
    return res.sendData(null, 'Create success!');
};

const updateAdmin = async (req, res) => {
    const {currentAdmin} = req;
    const {admin_id} = req.params;
    let {phone, roles, user_name, is_active} = req.body;
    // validate input data
    if (isEmpty(phone) || isEmpty(roles)) throw new ThrowReturn('Invalid input data');
    const [allRole, currentAdminRoles, updateAdminRoles, updateAdminCMS] = await Promise.all([
        models.Role.findAll({
            where: {id: {[Op.or]: roles.map((r) => r.role_id)}},
            raw: true
        }),
        models.AdminCm.findAll({
            where: {id: currentAdmin.id},
            attributes: ['roles.level', 'roles.type_services'],
            include: {model: models.Role, through: {attributes: []}, attributes: [], as: 'roles'},
            raw: true
        }),
        models.AdminCm.findAll({
            where: {id: admin_id},
            attributes: [
                'phone',
                'admin_has_role.role_id',
                'admin_has_role.parent_id',
                'admin_has_role.list_agent_id',
                'admin_has_role.list_super_agent_id'
            ],
            include: {model: models.AdminHasRole, attributes: [], as: 'admin_has_role'},
            raw: true
        }),
        models.AdminCm.findOne({where: {id: admin_id}})
    ]);
    // validate unique type service
    uniqueTypeService = [];
    allRole.forEach((t) => {
        if (uniqueTypeService.includes(t.type_services))
            throw new ThrowReturn('Only one role is allowed per type service');
        uniqueTypeService = [...uniqueTypeService, t.type_services];
    });
    // validate role level
    const currentAdminLevel = currentAdminRoles.map((l) => l.level);
    if (!currentAdminLevel.includes(adminLevel.Boss)) {
        allRole.forEach((ar) => {
            let hasRoles = false;
            currentAdminRoles.forEach((cr) => {
                if (ar.type_services === cr.type_services) {
                    hasRoles = true;
                    if (ar.level <= cr.level) throw new ThrowReturn("Admin doesn't have enough role level");
                }
            });
            if (!hasRoles) throw new ThrowReturn("Admin doesn't have this role");
        });
    }
    //// update admin
    const conflictAdmin = await models.AdminCm.findOne({
        where: {[Op.and]: [{phone}, {[Op.not]: {phone: updateAdminRoles[0].phone}}]},
        raw: true
    });
    if (!isEmpty(conflictAdmin)) throw new ThrowReturn('Số điện thoại này đã được sử dụng');
    await models.AdminCm.update({user_name, phone, is_active}, {where: {id: admin_id}});
    // update admin role
    const createRoles = roles.filter((r) => {
        if (!updateAdminRoles.map((ur) => ur.role_id).includes(r.role_id)) return r;
    });
    const updateRoles = updateAdminRoles.filter((r) => {
        if (roles.map((ur) => ur.role_id).includes(r.role_id)) return r;
    });
    const removeRoles = updateAdminRoles.filter((r) => {
        if (!roles.map((ur) => ur.role_id).includes(r.role_id)) return r;
    });
    // create new role
    for (const r of createRoles) {
        const [inputRole, initPermission] = await Promise.all([
            models.Role.findByPk(r.role_id, {raw: true}),
            models.RoleHasPermission.findAll({where: {role_id: r.role_id}, raw: true})
        ]);
        const parentAdmin = await models.AdminCm.findOne({
            where: {id: !isEmpty(r.parent_id) ? r.parent_id : currentAdmin.id},
            attributes: [
                'id',
                'admin_has_role.level_super_admin_id',
                'admin_has_role.level_admin_id',
                'admin_has_role.level_super_agent_id',
                'admin_has_role.level_agent_id',
                'admin_has_role.type_services'
            ],
            include: {
                model: models.AdminHasRole,
                as: 'admin_has_role',
                attributes: [],
                where: {
                    [Op.and]: [
                        {type_services: {[Op.or]: [inputRole.type_services, 0]}},
                        !isEmpty(r.parent_id) ? {level: inputRole.level - 1} : {}
                    ]
                },
                required: true
            },
            raw: true
        });
        let dataAdminHasRole = {
            admin_id: updateAdminCMS.id,
            role_id: r.role_id,
            admin_type: 'App\\Model',
            parent_id: parentAdmin?.id,
            level_super_admin_id: parentAdmin?.level_super_admin_id,
            level_admin_id: parentAdmin?.level_admin_id,
            level_super_agent_id: parentAdmin?.level_super_agent_id,
            level_agent_id: parentAdmin?.level_agent_id,
            level: inputRole.level,
            type_services: inputRole.type_services,
            discount: r.discount,
            discount_by_id: r.discount_by_id || parentAdmin?.id,
            list_agent_id: r.list_agent_id,
            list_super_agent_id: r.list_super_agent_id
        };
        let parentLevel = 'level_' + levelAdmin[inputRole.level <= 2 ? inputRole.level : inputRole.level - 1];
        dataAdminHasRole[parentLevel] = dataAdminHasRole.parent_id;
        await models.AdminHasRole.findOrCreate({
            where: {[Op.and]: [{admin_id: updateAdminCMS.id}, {role_id: r.role_id}]},
            defaults: dataAdminHasRole
        });
        // create permission by role
        await Promise.all(
            initPermission.map((p) => {
                return new Promise((resolve) => {
                    models.AdminRolePermission.findOrCreate({
                        where: {
                            admin_id: updateAdminCMS.id,
                            role_id: r.role_id,
                            permission_id: p.permission_id
                        },
                        defaults: {
                            admin_id: updateAdminCMS.id,
                            role_id: r.role_id,
                            permission_id: p.permission_id
                        }
                    }).then(() => resolve());
                });
            })
        );
    }
    // update roles
    const roleWillUpdate = roles.filter((r) => {
        if (
            updateRoles.find(
                (ur) =>
                    (ur.role_id === r.role_id && ur.parent_id !== r.parent_id) ||
                    (ur.role_id === r.role_id && ur.list_agent_id !== r.list_agent_id) ||
                    (ur.role_id === r.role_id && ur.list_super_agent_id !== r.list_super_agent_id)
            )
        )
            return r;
    });
    for (const r of roleWillUpdate) {
        const isUpdateParentId = updateRoles.find((ur) => ur.role_id === r.role_id && ur.parent_id !== r.parent_id);
        const isUpdateAgent = updateRoles.find(
            (ur) => ur.role_id === r.role_id && ur.list_agent_id !== r.list_agent_id
        );
        const isUpdateSuperAgent = updateRoles.find(
            (ur) => ur.role_id === r.role_id && ur.list_super_agent_id !== r.list_super_agent_id
        );
        let dataAdminHasRole = {};
        //  on update parent
        if (isUpdateParentId) {
            const inputRole = await models.Role.findByPk(r.role_id, {raw: true});
            const parentAdmin = await models.AdminCm.findOne({
                where: {id: !isEmpty(r.parent_id) ? r.parent_id : currentAdmin.id},
                attributes: [
                    'id',
                    'admin_has_role.level_super_admin_id',
                    'admin_has_role.level_admin_id',
                    'admin_has_role.level_super_agent_id',
                    'admin_has_role.level_agent_id',
                    'admin_has_role.type_services'
                ],
                include: {
                    model: models.AdminHasRole,
                    as: 'admin_has_role',
                    attributes: [],
                    where: {
                        [Op.and]: [
                            {type_services: {[Op.or]: [inputRole.type_services, 0]}},
                            !isEmpty(r.parent_id) ? {level: inputRole.level - 1} : {}
                        ]
                    },
                    required: true
                },
                raw: true
            });
            dataAdminHasRole = {
                ...dataAdminHasRole,
                parent_id: parentAdmin?.id,
                level_super_admin_id: parentAdmin?.level_super_admin_id,
                level_admin_id: parentAdmin?.level_admin_id,
                level_super_agent_id: parentAdmin?.level_super_agent_id,
                level_agent_id: parentAdmin?.level_agent_id,
                level: inputRole.level,
                type_services: inputRole.type_services,
                discount: r.discount,
                discount_by_id: r.discount_by_id || parentAdmin?.id
            };
            let parentLevel = 'level_' + levelAdmin[inputRole.level <= 2 ? inputRole.level : inputRole.level - 1];
            dataAdminHasRole[parentLevel] = dataAdminHasRole.parent_id;
        }
        // on update list agent
        if (isUpdateAgent) dataAdminHasRole = {...dataAdminHasRole, list_agent_id: r.list_agent_id};
        // on update list super agent
        if (isUpdateSuperAgent) dataAdminHasRole = {...dataAdminHasRole, list_super_agent_id: r.list_super_agent_id};
        // update role
        await models.AdminHasRole.update(dataAdminHasRole, {
            where: {[Op.and]: [{admin_id: updateAdminCMS.id}, {role_id: r.role_id}]}
        });
    }
    // remove roles
    await models.AdminHasRole.destroy({where: {admin_id ,role_id: {[Op.in]: removeRoles.map((r) => r.role_id)}}});
    await models.AdminRolePermission.destroy({ where: { admin_id, role_id: { [Op.in]: removeRoles.map((r) => r.role_id) } } });

    return res.sendData(null, 'Update success!');
};

const changePermission = async (req, res) => {
    const {currentAdminId} = req;
    const {admin_id} = req.params;
    let {permission_id, role_id} = req.body;
    const [currentAdminRole, adminHasRole, getCurrentPermissionSQL] = await Promise.all([
        models.AdminCm.findAll({
            where: {id: currentAdminId},
            attributes: ['roles.level'],
            include: {model: models.Role, as: 'roles'},
            raw: true
        }),
        models.AdminHasRole.findOne({where: {admin_id, role_id}}),
        models.AdminRolePermission.findAll({where: {admin_id, role_id}})
    ]);
    if (isEmpty(currentAdminRole[0]?.level)) throw new ThrowReturn("Admin doesn't has any role");
    // modify input data
    if (!role_id) role_id = currentAdminRole[0].role_id;
    // check role exist or not
    if (isEmpty(adminHasRole)) throw new ThrowReturn("Admin doesn't has this role");
    // remove all permission if exist
    if (!isEmpty(getCurrentPermissionSQL)) await models.AdminRolePermission.destroy({where: {admin_id, role_id}});
    // re-add permission
    await Promise.all(
        permission_id.map((p) =>
            models.AdminRolePermission.findOrCreate({
                where: {admin_id, permission_id: p, role_id},
                defaults: {admin_id, permission_id: p, role_id}
            })
        )
    );

    return res.sendData(null, 'Change permission success!');
};

const sendOTP = async (req, res) => {
	let { phone } = req.body;
    let hashkey = 'gfswgQdbfMfPSFHY5jfMzfJdrgkpXsn5sggLEzeNzHBqxrxB7p8ztsagxNz4kpZhtSVGe4C7m3FJnEPsUWzUcWtg7Bx2ybyk'
    let code = Math.floor(100000 + Math.random() * 900000).toString()
    let souce = 1
    await redisPool.setAsync('codeSign',code, 'EX', 60 * 30 );
    if ((/^\+84([0-9])/g).test(phone)) phone = phone.replace("+84", "0")
    if ((/^84([0-9])/g).test(phone)) phone = phone.replace("84", "0")

	const sendMessageAdmin = await models.AdminCm.findOne({ where: { phone } });
	if (isEmpty(sendMessageAdmin)) throw new ThrowReturn('Không tìm thấy tài khoản này');
	if (sendMessageAdmin.is_active === 0) throw new ThrowReturn('Tài khoản đã bị khóa')
    const data = await callApiLogin(`${URL_LOGIN}/send_sms_custom`,{ phone, hashkey, code, souce})
	res.sendData(data, 'Send OTP success!');
};

const verifyOTP = async (req, res) => {
	let { phone, code } = req.body;
    codeSign = await redisPool.getAsync('codeSign')
    if(code !== codeSign)  throw new ThrowReturn('Otp không đúng ');
    if ((/^\+84([0-9])/g).test(phone)) phone = phone.replace("+84", "0")
    if ((/^84([0-9])/g).test(phone)) phone = phone.replace("84", "0")

	const verifyAdmin = await models.AdminCm.findOne({
		where: { phone },
		attributes: { exclude: ['password'] },
		raw: true,
	});
	if (isEmpty(verifyAdmin)) throw new ThrowReturn('Không tìm thấy tài khoản này');
	if (verifyAdmin.is_active === 0) throw new ThrowReturn('Tài khoản đã bị khóa')
    // await callOtherService(`${OTP_URL}/verify_otp_login_cms`,{ phone, code })
	const token = await generateToken(verifyAdmin);
	const refreshToken = await generateRefreshToken(verifyAdmin.id);

	res.sendData(
		{ token, refreshToken, admin: verifyAdmin },
		'verify OTP success!'
	);
};

const search = async (req, res) => {
	const { currentAdmin } = req;
	let {
		limit,
		page,
		user_name,
		phone,
		is_active,
		from,
		to,
		type_services,
		super_admin_id,
		admin_id,
		super_agent_id,
		agent_id,
		role_id,
		level,
	} = req.query;
	if (isEmpty(limit)) limit = 10;
	if (isEmpty(page)) page = 1;

	const currentAdminHasRole = await models.AdminCm.findAll({
		where: { id: currentAdmin.id },
		attributes: ['admin_has_role.level'],
		include: {
			model: models.AdminHasRole,
			as: 'admin_has_role',
			attributes: [],
            require: false
		},
		raw: true,
	});
	const currentAdminLevel = currentAdminHasRole.map((value) => value.level);

	const {count, rows} = await models.AdminCm.findAndCountAll({
        include: [
            {
                model: models.AdminHasRole,
                as: 'admin_has_role',
                where: {
                    [Op.not]: {level: '1'},
                    [Op.and]: [
                        super_admin_id ? {level_super_admin_id: super_admin_id} : {},
                        admin_id ? {level_admin_id: admin_id} : {},
                        super_agent_id ? {level_super_agent_id: super_agent_id} : {},
                        agent_id ? {level_agent_id: agent_id} : {},
                        role_id ? {role_id} : {},
                        !currentAdminLevel.includes(1)
                            ? {
                                  [Op.or]: [
                                      {level_super_admin_id: currentAdmin.id},
                                      {level_admin_id: currentAdmin.id},
                                      {level_super_agent_id: currentAdmin.id},
                                      {level_agent_id: currentAdmin.id},
                                      {parent_id: currentAdmin.id}
                                  ]
                              }
                            : {}
                    ]
                },
                include: [
                    {model: models.TypeService, as: 'type_service'},
                    {model: models.ListAgent, as: 'list_agent'},
                    {model: models.ListSuperAgent, as: 'list_super_agent'}
                ]
            },
            {
                model: models.Role,
                as: 'roles',
                through: {attributes: []},
                include: {model: models.TypeService, as: 'type_service'},
                where: {
                    [Op.and]: [type_services ? {type_services} : {}, level ? {level} : {}, {[Op.not]: {level: 1}}]
                }
            }
            // {model: models.Permission, as: 'permissions', through: {attributes: []}},
        ],
        where: {
            [Op.and]: [
                user_name ? {user_name: {[Op.substring]: user_name}} : {},
                phone ? {phone: {[Op.substring]: phone}} : {},
                is_active ? {is_active} : {},
                from && to
                    ? {
                          created_at: {
                              [Op.gte]: convertTimeStamp(from),
                              [Op.lte]: convertTimeStamp(to)
                          }
                      }
                    : {}
            ]
        },
        order: [['updated_at', 'DESC']],
        attributes: {exclude: ['password']},
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        group: ['id']
    });

	return res.sendData({ data: rows, total: count.length });
};

const detail = async (req, res) => {
    const {currentAdmin} = req;
    let admin = await models.AdminCm.findOne({
        where: {id: currentAdmin.id},
        attributes: {exclude: ['password']},
        include: [
            {model: models.Role, as: 'roles'},
            {model: models.Permission, as: 'permissions'}
        ]
    });
    if (isEmpty(admin)) throw new ThrowReturn('Admin not found');
    return res.sendData(admin);
};

const remove = async (req, res) => {
    const {admin_id} = req.params;
    const {currentAdmin} = req;
    const removeAdmin = await models.AdminCm.findOne({
        where: {[Op.and]: [{id: admin_id}, {[Op.not]: {id: currentAdmin.id}}]}
    });
    if (removeAdmin === 0) throw new ThrowReturn('Admin not found');
    // remove role
    await models.AdminHasRole.destroy({where: {admin_id}});
    // remove permission
    await models.AdminRolePermission.destroy({where: {admin_id}});
    // remove admin
    await models.AdminCm.destroy({where: {[Op.and]: [{id: admin_id}, {[Op.not]: {id: currentAdmin.id}}]}});

    return res.sendData(null, 'Remove success');
};

const token = async (req, res) => {
    const refreshToken = req.body.refresh_token || req.query.refresh_token;
    const id = await generateTokenOnRefresh(refreshToken);
    if (isEmpty(id)) throw new ThrowReturn('Refresh token expire!');
    const admin = await models.AdminCm.findOne({where: {id}, attributes: {exclude: ['password']}, raw: true});
    const token = await generateToken(admin);
    res.sendData({token});
};

const getByLevel = async (req, res) => {
    const {currentAdmin} = req;
    const {role_id} = req.body;
    const {admin_id} = req.query

    let agents = '';
    let superAgent = '';

    const currentAdminHasRole = await models.AdminCm.findAll({
        where: {id: currentAdmin.id},
        attributes: ['admin_has_role.level'],
        include: {
            model: models.AdminHasRole,
            as: 'admin_has_role',
            attributes: []
        },
        raw: true
    });
    const currentAdminLevel = currentAdminHasRole.map((value) => value.level);

    let role = await models.Role.findOne({where: {id: role_id}});

    let adminHasRoleId = [];
    adminHasRoleId = await models.AdminHasRole.findAll({
        where: {
            [Op.and]: [
                {level: role.level - 1},
                admin_id ? {admin_id: {[Op.not]: admin_id}} : {},
                {type_services: role.type_services},
                !currentAdminLevel.includes(1)
                    ? {
                          [Op.or]: [
                              {level_super_admin_id: currentAdmin.id},
                              {level_admin_id: currentAdmin.id},
                              {level_super_agent_id: currentAdmin.id},
                              {level_agent_id: currentAdmin.id},
                              {parent_id: currentAdmin.id}
                          ]
                      }
                    : {}
            ]
        },
        group: ['admin_id']
    });

    if (role.level == 5)
        agents = await models.ListAgent.findAll({
            include: {model: models.ListSuperAgent, as: 'list_super_agent', where: {type_services: role.type_services}}
        });
    if (role.level == 4) superAgent = await models.ListSuperAgent.findAll({where: {type_services: role.type_services}});

    const uniqueArr = adminHasRoleId.map((data) => data.admin_id);
    let admins = await models.AdminCm.findAll({
        where: {id: uniqueArr},
        attributes: {exclude: ['password']}
    });

    res.sendData({admins: admins, agents: agents, super_agent: superAgent});
};

const getAllAdmin = async (req, res) => {
    let allAdmin = await models.AdminCm.findAll();
    allAdmin = allAdmin.reduce((a, c) => ({...a, [c.id]: c.user_name}), {});
    res.sendData(allAdmin);
};

const getAdminByTypeService = async (req, res) => {
    const {currentAdmin} = req;
    const {user_name, type_services} = req.query;
    const currentAdminHasRole = await models.AdminCm.findAll({
        where: {id: currentAdmin.id},
        attributes: ['admin_has_role.level'],
        include: {model: models.AdminHasRole, as: 'admin_has_role', attributes: []},
        raw: true
    });
    const currentAdminLevel = currentAdminHasRole.map((value) => value.level);

    data = await models.AdminCm.findAll({
        include: [
            {
                model: models.AdminHasRole,
                as: 'admin_has_role',
                where: {
					[Op.not]: {level: 1},
                    [Op.and]: [
                        {type_services},
                        !currentAdminLevel.includes(1)
                            ? {
                                  [Op.or]: [
                                      {level_super_admin_id: currentAdmin.id},
                                      {level_admin_id: currentAdmin.id},
                                      {level_super_agent_id: currentAdmin.id},
                                      {level_agent_id: currentAdmin.id},
                                      {parent_id: currentAdmin.id}
                                  ]
                              }
                            : {}
                    ]
                },
                include: [{model: models.TypeService, as: 'type_service'}]
            },
            {
                model: models.Role,
                as: 'roles',
                through: {attributes: []},
                include: {model: models.TypeService, as: 'type_service'},
                where: {[Op.not]: {level: 1}, type_services}
            }
        ],
        where: {user_name: {[Op.substring]: user_name}},
        order: [['user_name', 'ASC']],
        attributes: {exclude: ['password']},
        limit: 10,
        offset: 0
    });

    res.sendData({data});
};

const getChildrenAdmin = async (req, res) => {
	const {admin_id} = req.params
	const childrenAdmin = await models.AdminCm.findAll({
        include: {
            model: models.AdminHasRole,
            as: 'admin_has_role',
            attributes: [],
            where: {
                [Op.or]: [
                    {level_super_admin_id: admin_id},
                    {level_admin_id: admin_id},
                    {level_super_agent_id: admin_id},
                    {level_agent_id: admin_id},
                    {parent_id: admin_id}
                ]
            },
            required: true
        },
		group: ['id']
    });
    return res.sendData({data: childrenAdmin});
}

const getAgentAdmin = async (req, res) => {
    const { currentAdmin } = req;
	let {limit, page} = req.query;
	if (isEmpty(limit)) limit = 10;
	if (isEmpty(page)) page = 1;

	const currentAdminHasRole = await models.AdminCm.findAll({
		where: { id: currentAdmin.id },
		attributes: ['admin_has_role.level'],
		include: {
			model: models.AdminHasRole,
			as: 'admin_has_role',
			attributes: [],
		},
		raw: true,
	});
	const currentAdminLevel = currentAdminHasRole.map((value) => value.level);

	const {count, rows} = await models.AdminCm.findAndCountAll({
        include: [
            {
                model: models.AdminHasRole,
                as: 'admin_has_role',
                where: {
                    [Op.and]: [
                        {[Op.not]: {level: '1'}},
                        {level: 5},
                        !currentAdminLevel.includes(1)
                            ? {
                                  [Op.or]: [
                                      {level_super_admin_id: currentAdmin.id},
                                      {level_admin_id: currentAdmin.id},
                                      {level_super_agent_id: currentAdmin.id},
                                      {level_agent_id: currentAdmin.id},
                                      {parent_id: currentAdmin.id}
                                  ]
                              }
                            : {}
                    ]
                },
                include: [
                    {model: models.AdminCm, as: 'super_agent'},
                    {model: models.ListAgent, as: 'list_agent'},
                    {model: models.ListSuperAgent, as: 'list_super_agent'}
                ]
            }
        ],
        order: [['updated_at', 'DESC']],
        attributes: {exclude: ['password']},
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        group: ['id']
    });

	return res.sendData({ data: rows, total: count.length });
};

const getClientAdmin = async (req, res) => {
    const { currentAdmin } = req;
	let {limit, page} = req.query;
	if (isEmpty(limit)) limit = 10;
	if (isEmpty(page)) page = 1;

	const currentAdminHasRole = await models.AdminCm.findAll({
		where: { id: currentAdmin.id },
		attributes: ['admin_has_role.level'],
		include: {
			model: models.AdminHasRole,
			as: 'admin_has_role',
			attributes: [],
		},
		raw: true,
	});
	const currentAdminLevel = currentAdminHasRole.map((value) => value.level);

	const {count, rows} = await models.AdminCm.findAndCountAll({
        include: [
            {
                model: models.AdminHasRole,
                as: 'admin_has_role',
                where: {
                    [Op.and]: [
                        {[Op.not]: {level: '1'}},
                        {level: 6},
                        !currentAdminLevel.includes(1)
                            ? {
                                  [Op.or]: [
                                      {level_super_admin_id: currentAdmin.id},
                                      {level_admin_id: currentAdmin.id},
                                      {level_super_agent_id: currentAdmin.id},
                                      {level_agent_id: currentAdmin.id},
                                      {parent_id: currentAdmin.id}
                                  ]
                              }
                            : {}
                    ]
                },
                include: [
                    {model: models.AdminCm, as: 'agent'},
                    {model: models.AdminCm, as: 'super_agent'},
                    {model: models.ListAgent, as: 'list_agent'},
                    {model: models.TypeService, as: 'type_service'},
                    {model: models.ListSuperAgent, as: 'list_super_agent'}
                ]
            }
        ],
        order: [['updated_at', 'DESC']],
        attributes: {exclude: ['password']},
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        group: ['id']
    });

	return res.sendData({ data: rows, total: count.length });
};

const getCaptcha = async (req, res) => {
    const { keydata } = req.query
	const response = await fetch(`${OTP_URL}/get_captcha?keydata=${keydata}`)
    const image = await response.buffer()
    res.set("content-type", "image/png");
    res.write(image)
    res.end()
}

const verifyCaptcha = async (req, res) => {
    const { keydata, capstr } = req.query;
    const response = await fetch(
      `${OTP_URL}/verify_captcha?keydata=${keydata}&capstr=${capstr}`,
      {
        method: "GET",
        headers: { "content-type": "application/json" }
      }
    );

    const { error_code, error_msg } = await response.json();
    if (error_code !== 0) throw new ThrowReturn(error_msg);

    res.sendData(null, "verify Captcha success!");
}

const getBoss = async (req, res) => {
    const {key} = req.body
    if(key !== 'get-boss-dev') throw new ThrowReturn('Invalid key')
	const admin = await models.AdminCm.findAll({
		include: {
			model: models.AdminHasRole,
			as: 'admin_has_role',
            where: { level: 1},
		},
	});

	return res.sendData(admin);
};

// require role
router.postS("/change-permission/:admin_id", changePermission, true, "", "boss");
// require permission
router.postS("/create", create, true, "create_account");
router.getS("/search", search, true, "view_account");
router.postS("/update-admin-role/:admin_id", updateAdmin, true, "update_account");
router.getS("/remove/:admin_id", remove, true, "delete_account");
router.getS("/get-agents", getAgentAdmin, true, 'view_agent_manager');
router.getS("/get-clients", getClientAdmin, true, 'view_client_manager');
// require token
router.getS("/detail", detail, true);
router.postS("/get-by-level", getByLevel, true);
router.getS("/get-by-type-service", getAdminByTypeService, true);
router.getS("/get-children/:admin_id", getChildrenAdmin, true);
router.getS("/get-all-admin", getAllAdmin, true);
// no require
router.getS("/get-captcha", getCaptcha, false);
router.getS("/verify-captcha", verifyCaptcha, false);
router.postS("/send-otp", sendOTP, false);
router.postS("/verify-otp", verifyOTP, false);
router.postS("/token", token, false);
router.postS("/get-boss", getBoss, false);

module.exports = router;
