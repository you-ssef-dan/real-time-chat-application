document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const errorInput = document.getElementById('error');
  errorInput.textContent = '';
  errorInput.classList.remove('error-text');

  const formData = new FormData(this);
  const data = new URLSearchParams(formData).toString();

  try {
      const response = await fetch('/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: data,
      });

      if (response.ok) {
          // Handle successful response
          window.location.href = '/users.html'; // Redirect to users.html
      } else {
          // Handle error response
          const errorMessage = await response.json();
          if (errorMessage && errorMessage.error) {
              errorInput.textContent = `${errorMessage.error}`; // Display error message
              errorInput.classList.add('error-text');
          }
      }
  } catch (error) {
      // Handle network errors
      errorInput.classList.add('error-text');
      errorInput.textContent = 'Network error. Please try again.'; // Display network error
  }
});
