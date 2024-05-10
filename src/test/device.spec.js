process.env.NODE_ENV = 'test';
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');
chai.use(chaiHttp);

describe('Devices API', () => {
	describe('Get all devices', () => {
		it('should return device[]', (done) => {
			chai
				.request(server)
				.get('/device/all')
				.end((_, res) => {
					console.log('res', res.body);
					expect(res.body.data).to.be.a('array');
					done();
				});
		});
	});

	// describe('Add device', () => {
	// 	it('should add successfully', (done) => {
	// 		chai
	// 			.request(server)
	// 			.post('/device/add')
	// 			.send({
	// 				name: 'string',
	// 				note: 'string',
	// 			})
	// 			.end((err, res) => {
	// 				if (err) {
	// 					console.log(err);
	// 				}
	// 				expect(res.body.error_msg).to.equal('Add successfully');
	// 				done();
	// 			});
	// 	});
	// });

	describe('Get devices by department', () => {
		it('should return device[]', (done) => {
			chai
				.request(server)
				.get('/device/department?departmentId=8')
				.end((_, res) => {
					expect(res.body.data).to.be.a('array');
					done();
				});
		});
	});

	describe('Update device', () => {
		it('should update device successfully', (done) => {
			chai
				.request(server)
				.post('/device/update/136')
				.send({
					name: 'string',
					note: 'string',
				})
				.end((_, res) => {
					expect(res.body.error_msg).to.equal('Update successfully');
					done();
				});
		});
	});

	describe('Delete device', () => {
		it('should delete successfully', (done) => {
			chai
				.request(server)
				.delete('/device/delete/136')
				.end((_, res) => {
					expect(res.body.error_msg).to.equal('Delete successfully');
					done();
				});
		});
	});
});
