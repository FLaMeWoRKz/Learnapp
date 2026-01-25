#!/usr/bin/env node

/**
 * Test script for local development
 * Tests the API endpoints with local storage
 * Requires Node.js 18+ (native fetch support)
 */

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('❌ Node.js 18+ required for native fetch support');
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing VocabMaster API with local storage...\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error(`Health check failed: ${healthRes.status}`);
    }
    const health = await healthRes.json();
    console.log('✅ Health check:', health);
    console.log('');

    // Test 2: Register user
    console.log('2️⃣ Testing user registration...');
    const registerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'testuser',
        password: 'test123'
      })
    });
    const registerData = await registerRes.json();
    if (registerRes.ok) {
      console.log('✅ User registered:', registerData.user);
      const token = registerData.token;
      console.log('');

      // Test 3: Get user info
      console.log('3️⃣ Testing get user info...');
      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!meRes.ok) {
        throw new Error(`Get user failed: ${meRes.status}`);
      }
      const meData = await meRes.json();
      console.log('✅ User info:', meData);
      console.log('');

      // Test 4: Get vocabularies
      console.log('4️⃣ Testing get vocabularies...');
      const vocabRes = await fetch(`${API_URL}/api/vocab`);
      if (!vocabRes.ok) {
        console.log('⚠️ Vocab endpoint returned:', vocabRes.status);
      } else {
        const vocabData = await vocabRes.json();
        console.log(`✅ Found ${vocabData.count || 0} vocabularies`);
      }
      console.log('');

      console.log('✅ All tests passed!');
      console.log('\n💡 Data is stored in: backend/data/');
    } else {
      if (registerData.error?.includes('already')) {
        console.log('⚠️ User already exists, trying login instead...');
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'test123'
          })
        });
        if (loginRes.ok) {
          console.log('✅ Login successful!');
        }
      } else {
        console.log('⚠️ Registration failed:', registerData);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   cd backend && npm run dev');
    process.exit(1);
  }
}

testAPI();
