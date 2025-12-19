import { executeQuery } from './server/utils/db';

async function checkFoldersTable() {
  try {
    const result: any = await executeQuery("SHOW TABLES LIKE 'folders'");
    console.log('Folders table exists:', result.length > 0);
    
    if (result.length > 0) {
      console.log('\nDropping folders table...');
      await executeQuery('DROP TABLE IF EXISTS folders');
      console.log('✓ Folders table dropped');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFoldersTable();
