const SUPABASE_URL='https://elvvupvcfdstkqpdtxxr.supabase.co';
const SUPABASE_KEY='sb_publishable_V_tJaxkTECrDUig_kFT7zw_VWPd8L4C';
const SIGNUP_FUNCTION=`${SUPABASE_URL}/functions/v1/initial-admin-signup-v2`;
const DASHBOARD_URL='./dashboard.html?v=20260916-final';

const {createClient}=supabase;
const client=createClient(SUPABASE_URL,SUPABASE_KEY);

const modal=document.getElementById('authModal');
const loginForm=document.getElementById('loginForm');
const signupForm=document.getElementById('signupForm');
const login=document.getElementById('login');
const signup=document.getElementById('signup');
const loginEmail=document.getElementById('loginEmail');
const loginPassword=document.getElementById('loginPassword');
const signupEmail=document.getElementById('signupEmail');
const signupPassword=document.getElementById('signupPassword');
const signupConfirm=document.getElementById('signupConfirm');
const status=document.getElementById('status');

function setStatus(msg,type=''){
  status.textContent=msg;
  status.className=`status ${type}`;
}

function openAuth(view){
  modal.classList.remove('hidden');
  loginForm.classList.toggle('hidden',view!=='login');
  signupForm.classList.toggle('hidden',view!=='signup');
  setStatus('');
  if(view==='login') loginEmail.focus();
  if(view==='signup') signupEmail.focus();
}

function closeAuth(){
  modal.classList.add('hidden');
  setStatus('');
}

document.querySelectorAll('[data-view]').forEach(button=>{
  button.addEventListener('click',()=>openAuth(button.dataset.view));
});

document.getElementById('closeAuth').addEventListener('click',closeAuth);
document.querySelector('.modal-backdrop').addEventListener('click',closeAuth);

login.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=login.querySelector('button[type="submit"]');
  button.disabled=true;
  setStatus('Signing in…');

  try{
    const {data,error}=await client.auth.signInWithPassword({
      email:loginEmail.value.trim().toLowerCase(),
      password:loginPassword.value
    });

    if(error) throw error;
    if(!data.session) throw new Error('Login was not confirmed by Supabase.');

    const {data:profile,error:profileError}=await client
      .from('admin_profiles')
      .select('id,is_admin')
      .eq('id',data.session.user.id)
      .eq('is_admin',true)
      .maybeSingle();

    if(profileError) throw profileError;
    if(!profile) throw new Error('Admin access could not be confirmed.');

    setStatus('Login successful.','success');
    window.location.assign(DASHBOARD_URL);
  }catch(error){
    setStatus(error.message||'Login failed.','error');
  }finally{
    button.disabled=false;
  }
});

signup.addEventListener('submit',async event=>{
  event.preventDefault();

  if(signupPassword.value!==signupConfirm.value){
    setStatus('Passwords do not match.','error');
    return;
  }

  const button=signup.querySelector('button[type="submit"]');
  button.disabled=true;
  setStatus('Creating the initial admin account…');

  try{
    const response=await fetch(SIGNUP_FUNCTION,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':SUPABASE_KEY
      },
      body:JSON.stringify({
        email:signupEmail.value.trim().toLowerCase(),
        password:signupPassword.value
      })
    });

    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body.success){
      throw new Error(body.error||'Account creation failed.');
    }

    if(body.requires_email_confirmation){
      setStatus('Account created. Check your email and click the verification link before logging in.','success');
    }else{
      setStatus('Account created successfully.','success');
    }

    signup.reset();
  }catch(error){
    setStatus(error.message||'Account creation failed.','error');
  }finally{
    button.disabled=false;
  }
});
