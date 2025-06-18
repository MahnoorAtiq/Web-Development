 document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('checkoutForm');
            const successMessage = document.getElementById('successMessage');
            
            const showError = (inputElement, errorMessage) => {
                const formGroup = inputElement.parentElement;
                const errorElement = document.getElementById(inputElement.id + 'Error');
                
                formGroup.classList.add('has-error');
                if (errorElement && errorMessage) {
                    errorElement.textContent = errorMessage;
                }
                
                return false;
            };
            
            const clearError = (inputElement) => {
                const formGroup = inputElement.parentElement;
                formGroup.classList.remove('has-error');
                
                return true;
            };
            
            const validateFullName = () => {
                const fullName = document.getElementById('fullName');
                const pattern = /^[A-Za-z ]+$/;
                
                if (!fullName.value.trim()) {
                    return showError(fullName, 'Full name is required');
                } else if (!pattern.test(fullName.value)) {
                    return showError(fullName, 'Full name can only contain letters');
                }
                
                return clearError(fullName);
            };
            
            const validateEmail = () => {
                const email = document.getElementById('email');
                const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (!email.value.trim()) {
                    return showError(email, 'Email is required');
                } else if (!pattern.test(email.value)) {
                    return showError(email, 'Please enter a valid email address');
                }
                
                return clearError(email);
            };
            
            const validatePhone = () => {
                const phone = document.getElementById('phone');
                const pattern = /^[0-9]{11}$/;
                
                if (!phone.value.trim()) {
                    return showError(phone, 'Phone number is required');
                } else if (!pattern.test(phone.value)) {
                    return showError(phone, 'Phone number must be exactly 11 digits');
                }
                
                return clearError(phone);
            };
            
            const validateAddress = () => {
                const address = document.getElementById('address');
                
                if (!address.value.trim()) {
                    return showError(address, 'Address is required');
                }
                
                return clearError(address);
            };
            
            const validateCardNumber = () => {
                const cardNumber = document.getElementById('cardNumber');
                const pattern = /^[0-9]{16}$/;
                
                if (!cardNumber.value.trim()) {
                    return showError(cardNumber, 'Card number is required');
                } else if (!pattern.test(cardNumber.value)) {
                    return showError(cardNumber, 'Please enter a valid 16-digit card number');
                }
                
                return clearError(cardNumber);
            };
            
            const validateExpiryDate = () => {
                const expiryDate = document.getElementById('expiryDate');
                
                if (!expiryDate.value.trim()) {
                    return showError(expiryDate, 'Expiry date is required');
                } else {
                    const [month, year] = expiryDate.value.split('/');
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth() + 1; // Month is 0-indexed
                
                    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
                        return showError(expiryDate, 'Please enter a valid future expiry date');
                    }
                }
                
                return clearError(expiryDate);
            };
            
            const validateCVV = () => {
                const cvv = document.getElementById('cvv');
                const pattern = /^[0-9]{3}$/;
                
                if (!cvv.value.trim()) {
                    return showError(cvv, 'CVV is required');
                } else if (!pattern.test(cvv.value)) {
                    return showError(cvv, 'CVV must be 3 digits');
                }
                
                return clearError(cvv);
            };
            
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                
                let isValid = true;
                
                isValid &= validateFullName();
                isValid &= validateEmail();
                isValid &= validatePhone();
                isValid &= validateAddress();
                isValid &= validateCardNumber();
                isValid &= validateExpiryDate();
                isValid &= validateCVV();
                
                if (isValid) {
                    successMessage.style.display = 'block';
                    form.reset();
                }
            });
        });