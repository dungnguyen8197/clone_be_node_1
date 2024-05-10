process.env.NODE_ENV = 'test';
const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');
chai.use(chaiHttp);

describe('Comapny API', () => {
	describe('Get all department', () => {
		it('should return department[]', (done) => {
			chai
				.request(server)
				.get('/department/all')
				.end((err, res) => {
					expect(res.body.data).to.be.a('array');
					done();
				});
		});
	});

	describe('Add department', () => {
		it('should add department successfully', (done) => {
			chai
				.request(server)
				.post('/department/add')
				.send({
					name: 'department',
					company_id: 4,
				})
				.end((err, res) => {
					expect(res.body.error_msg).to.equal('Create successfully');
					done();
				});
		});
	});
});
