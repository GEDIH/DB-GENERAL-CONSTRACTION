/**
 * Script to update company information in the database
 */

const { Sequelize } = require('sequelize');
const config = require('./config/database');

const sequelize = new Sequelize(config.development);

const updateCompanyInfo = async () => {
  try {
    await sequelize.query(`
      UPDATE company_info 
      SET 
        history = 'We are a dynamic and forward-thinking team committed to delivering exceptional results. With a strong foundation in professionalism, expertise, and customer focus, we help clients achieve success through smart strategy, tailored solutions, and continuous collaboration.',
        mission = 'Our mission is to provide intelligent, reliable, and scalable solutions that empower businesses, enhance innovation, and drive measurable outcomes.',
        team_info = 'Our team brings together diverse expertise and experience across multiple industries. We pride ourselves on quality, precision, and creativity in every project we undertake.',
        updated_at = NOW()
      WHERE company_name = 'DB GENERAL CONSTRUCTION'
    `);
    
    console.log('✓ Company information updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating company info:', error);
    process.exit(1);
  }
};

updateCompanyInfo();
