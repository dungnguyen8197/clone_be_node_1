const moment = require('moment')

const convertTimeStamp = (time) => {
    return moment(parseInt(time * 1000)).format('YYYY-MM-DD')
}

const queryInArray = (list) => {
    let query = ''
    if (list && (typeof list === 'string' || typeof list === 'number')) {
        query += `= '${list}'`
    } else if (list && list.length > 0) {
        let spilt = list.reduce((a, c) => a + `'${c}',`, '')
        spilt = spilt.slice(0, -1)
        query += `in (${spilt})`
    }
    return query
}

const customizeMenu = (menus) => {
    const array = []
    const list = menus.reduce(function (a, c) {
        if (c.parent_id === 0) {
            array.push(c)
            return [
                ...a,
                array.length >= menus.length
                    ? c
                    : {
                          ...c,
                          children: menus.reduce((a1, c1) => {
                              if (c1.parent_id === c.id) {
                                  array.push(c1)
                                  return [
                                      ...a1,
                                      array.length >= menus.length
                                          ? c1
                                          : {
                                                ...c1,
                                                children: menus.reduce((a2, c2) => {
                                                    if (c2.parent_id === c1.id) {
                                                        array.push(c2)
                                                        return [
                                                            ...a2,
                                                            array.length >= menus.length
                                                                ? c2
                                                                : {
                                                                      ...c2,
                                                                      children: menus.reduce((a3, c3) => {
                                                                          if (c3.parent_id === c2.id) {
                                                                              return [...a3, c3]
                                                                          }
                                                                          return a3
                                                                      }, []),
                                                                  },
                                                        ]
                                                    }
                                                    return a2
                                                }, []),
                                            },
                                  ]
                              }
                              return a1
                          }, []),
                      },
            ]
        }
        return a
    }, [])
    return list
}

module.exports = { convertTimeStamp}
