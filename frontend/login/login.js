const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const payload = {
        email : document.getElementById('email').value,
        password : document.getElementById('password').value
    }

    try {

        const res = await fetch('/tenant/login', {
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify(payload)
        })

        const data = await res.json();

        if(!res.ok){
            throw new Error(data.message);
        }

        localStorage.setItem('authToken', data.message);
        

        window.location.href = '/dasboard';
    }
    catch(err){
        console.log(err);
        
       
    }
})