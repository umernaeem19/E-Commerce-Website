//  alert('hello');
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}

document.addEventListener("DOMContentLoaded", function () {
    const addToCartButton = document.querySelector('#addToCartBtn');

    if (!addToCartButton) {
        console.error('Add to Cart button not found.');
        return;
    }

    addToCartButton.addEventListener('click', function () {
        alert('Button clicked!');

        // Get product information
        const productName = document.querySelector('.single-pro-details h4').innerText;
        const productImage = document.querySelector('.single-pro-image img').src;
        const productPrice = document.querySelector('.single-pro-details h2').innerText;
        const productQuantity = document.querySelector('.single-pro-details input').value;
        // alert(productName);
        // alert(productPrice);
        // alert(productQuantity);

        // Create a new table row
        const newRow = document.createElement('tr');
        
        // Add HTML for the new row
        newRow.innerHTML = `
            <td><a href="#"><i class="far fa-times-circle"></i></a></td>
            <td><img src="${productImage}" alt=""></td>
            <td>${productName}</td>
            <td>${productPrice}</td>
            <td><input type="number" value="${productQuantity}" name="" id=""></td>
            <td>${calculateSubtotal(productPrice, productQuantity)}</td>
        `;
        console.log('New Row Contents:', newRow);
        // Append the new row to the tbody
       
    });

    // Function to calculate subtotal
    function calculateSubtotal(price, quantity) {
        const numericPrice = parseFloat(price.slice(1));
        return `$${(numericPrice * quantity).toFixed(2)}`;
    }
}); 

