const axios = require('axios');

async function testAdmin() {
  const baseURL = 'http://localhost:5000/api';

  console.log('Testing Super Admin Login...');
  const loginRes = await axios.post(`${baseURL}/login`, {
    email: 'superadmin@anivault.com',
    password: 'admin123@anivault'
  });

  const token = loginRes.data.token;
  console.log('Super Admin logged in. Role:', loginRes.data.user.role);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  console.log('\nFetching Admin Stats...');
  const statsRes = await axios.get(`${baseURL}/admin/stats`, authHeader);
  console.log('Admin Stats:', statsRes.data.data);

  console.log('\nFetching User List...');
  const usersRes = await axios.get(`${baseURL}/admin/users`, authHeader);
  console.log(`Fetched ${usersRes.data.data.length} users:`);
  usersRes.data.data.forEach(u => {
    console.log(` - [ID ${u.id}] ${u.name} (${u.email}) | Role: ${u.role} | Active: ${u.is_active} | Logins: ${u.login_count} | Last Login: ${u.last_login}`);
  });

  // Find user satish
  const satish = usersRes.data.data.find(u => u.email === 'satish09@gmail.com');
  if (satish) {
    console.log(`\nTesting status toggle for ${satish.email}...`);
    const deactRes = await axios.put(`${baseURL}/admin/users/${satish.id}/status`, { is_active: false }, authHeader);
    console.log('Deactivated response:', deactRes.data.message);

    // Verify satish cannot login
    try {
      await axios.post(`${baseURL}/login`, { email: 'satish09@gmail.com', password: 'rama&maya' });
      console.error('ERROR: Deactivated user was able to log in!');
    } catch (err) {
      console.log('Correctly blocked login for deactivated user:', err.response?.data?.message);
    }

    // Reactivate satish
    const actRes = await axios.put(`${baseURL}/admin/users/${satish.id}/status`, { is_active: true }, authHeader);
    console.log('Reactivated response:', actRes.data.message);

    // Verify satish can login again
    const satishLogin = await axios.post(`${baseURL}/login`, { email: 'satish09@gmail.com', password: 'rama&maya' });
    console.log('Satish logged in successfully after reactivation! Login count:', satishLogin.data.user.login_count);
  }

  console.log('\nAll Super Admin API tests passed successfully!');
}

testAdmin().catch(e => {
  console.error('Test failed:', e.response?.data || e.message);
});
