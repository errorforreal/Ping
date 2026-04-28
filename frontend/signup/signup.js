const form = document.getElementById('signupForm');

form.addEventListener('submit',async (e)=>{
    e.preventDefault();

    const payload = {
        name : document.getElementById('name').value,
        email : document.getElementById('email').value,
        password : document.getElementById('password').value
    };

    try{
        const res = await fetch('/tenant/signup', {
            method : 'POST',
            headers : {'Content-Type' : 'application/json'},
            body : JSON.stringify(payload)
        })

        const data = await res.json();

        if(!res.ok){
            throw new Error(data.message); 
        }

        window.location.href = '/login';
    }
    catch(error){
        console.log(error);
        
       
    }

    
})
