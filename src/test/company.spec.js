process.env.NODE_ENV = 'test';
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');
chai.use(chaiHttp);

describe('Department API', () => {
	describe('Add company', () => {
		it('should add company successfully', (done) => {
			chai
				.request(server)
				.post('/company/add')
				.send({
					company_name: 'company',
				})
				.end((err, res) => {
					expect(res.body.error_msg).to.equal('Add successfully');
					done();
				});
		});
	});
});
