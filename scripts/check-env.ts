#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks for required environment variables for production deployment
 */

interface EnvCheck {
  name: string;
  required: boolean;
  description: string;
}

const REQUIRED_ENV_VARS: EnvCheck[] = [
  // CLIENT-SIDE VARIABLES (exposed to browser)
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL (client-side)'
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key (client-side)'
  },
  {
    name: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key for client-side operations'
  },
  {
    name: 'VITE_SENTRY_DSN',
    required: true,
    description: 'Sentry DSN for error monitoring (client-side)'
  },
  
  // SERVER-SIDE VARIABLES (Supabase Edge Functions)
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side)'
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key for server-side operations'
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook endpoint secret for signature verification'
  },
  
  // OPTIONAL VARIABLES
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID for calendar integration (optional)'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret for calendar integration (optional)'
  }
];

function checkEnvironmentVariables(): void {
  console.log('🔍 Checking Environment Variables...\n');
  
  const missing: EnvCheck[] = [];
  const present: EnvCheck[] = [];
  const optional: EnvCheck[] = [];

  REQUIRED_ENV_VARS.forEach(envVar => {
    const value = process.env[envVar.name];
    
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(envVar);
      } else {
        optional.push(envVar);
      }
    } else {
      present.push(envVar);
    }
  });

  // Report present variables
  if (present.length > 0) {
    console.log('✅ Present Environment Variables:');
    present.forEach(envVar => {
      const value = process.env[envVar.name];
      const maskedValue = envVar.name.includes('SECRET') || envVar.name.includes('KEY') 
        ? `${value?.substring(0, 8)}...` 
        : value;
      console.log(`   ${envVar.name}: ${maskedValue}`);
    });
    console.log();
  }

  // Report missing required variables
  if (missing.length > 0) {
    console.log('❌ Missing Required Environment Variables:');
    missing.forEach(envVar => {
      console.log(`   ${envVar.name}: ${envVar.description}`);
    });
    console.log();
  }

  // Report missing optional variables
  if (optional.length > 0) {
    console.log('⚠️  Missing Optional Environment Variables:');
    optional.forEach(envVar => {
      console.log(`   ${envVar.name}: ${envVar.description}`);
    });
    console.log();
  }

  // Summary
  const totalRequired = REQUIRED_ENV_VARS.filter(env => env.required).length;
  const presentRequired = present.filter(env => env.required).length;
  
  console.log(`📊 Summary: ${presentRequired}/${totalRequired} required environment variables present`);
  
  if (missing.length === 0) {
    console.log('🎉 All required environment variables are configured!');
    process.exit(0);
  } else {
    console.log(`❌ ${missing.length} required environment variable(s) missing`);
    console.log('\n💡 Create a .env file in the project root with the missing variables.');
    process.exit(1);
  }
}

// Check if we're running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEnvironmentVariables();
}

export { checkEnvironmentVariables, REQUIRED_ENV_VARS };
