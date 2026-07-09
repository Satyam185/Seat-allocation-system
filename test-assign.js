const http = require('http');

async function test() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(err => globalThis.fetch(...args));
  
  try {
    const res = await fetch('http://localhost:3000/api/employees?limit=100');
    const data = await res.json();
    const emp = data.data.find(e => e.project === null);
    if (!emp) {
      console.log('No unassigned project emp found');
      return;
    }
    console.log('Found emp:', emp.name);
    
    // get a project
    const projRes = await fetch('http://localhost:3000/api/projects');
    const projData = await projRes.json();
    const projectId = projData.data[0].id;
    
    const putRes = await fetch('http://localhost:3000/api/employees/' + emp.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    console.log('Update res ok?', putRes.ok);
    
    const res2 = await fetch('http://localhost:3000/api/employees?limit=100');
    const data2 = await res2.json();
    console.log('Emp in new list?', data2.data.some(e => e.id === emp.id));
  } catch (e) {
    console.error(e);
  }
}

test();
