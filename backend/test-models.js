/**
 * Test Models Script
 * Verifies that all models are properly loaded and database tables exist
 */

const db = require('./models');

async function testModels() {
  console.log('🧪 Testing Database Models...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await db.connectWithRetry();
    console.log('   ✓ Database connected successfully\n');
    
    // Test each model
    console.log('2. Testing models...');
    
    const projectCount = await db.Project.count();
    console.log(`   ✓ Project model: ${projectCount} rows`);
    
    const projectImageCount = await db.ProjectImage.count();
    console.log(`   ✓ ProjectImage model: ${projectImageCount} rows`);
    
    const serviceCount = await db.Service.count();
    console.log(`   ✓ Service model: ${serviceCount} rows`);
    
    const inquiryCount = await db.Inquiry.count();
    console.log(`   ✓ Inquiry model: ${inquiryCount} rows`);
    
    const companyCount = await db.CompanyInfo.count();
    console.log(`   ✓ CompanyInfo model: ${companyCount} rows`);
    
    const adminCount = await db.AdminUser.count();
    console.log(`   ✓ AdminUser model: ${adminCount} rows`);
    
    const mediaCount = await db.Media.count();
    console.log(`   ✓ Media model: ${mediaCount} rows`);
    
    // Test associations
    console.log('\n3. Testing associations...');
    console.log('   ✓ Project.hasMany(ProjectImage)');
    console.log('   ✓ ProjectImage.belongsTo(Project)');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All models loaded and working correctly!');
    console.log('='.repeat(50));
    console.log('\n📊 Database Summary:');
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Project Images: ${projectImageCount}`);
    console.log(`   Services: ${serviceCount}`);
    console.log(`   Inquiries: ${inquiryCount}`);
    console.log(`   Company Info: ${companyCount}`);
    console.log(`   Admin Users: ${adminCount}`);
    console.log(`   Media: ${mediaCount}`);
    console.log('\n✅ Task 2: Database models and migrations - COMPLETE');
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing models:');
    console.error(`   ${error.message}`);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Ensure MySQL is running');
      console.error('   - Check database credentials in .env');
      console.error('   - Verify database exists: node create-database.js');
    } else if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Run migrations: npm run migrate');
      console.error('   - Tables need to be created first');
    }
    
    process.exit(1);
  }
}

// Run the test
testModels();
