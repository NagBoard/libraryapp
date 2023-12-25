/*!
* Start Bootstrap - Simple Sidebar v6.0.6 (https://startbootstrap.com/template/simple-sidebar)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-simple-sidebar/blob/master/LICENSE)
*/
// 
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }

});

fetch('/reservations_active')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('active-reservations-table').tBodies[0];
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => console.error('Error:', error));

fetch('/reservations_closed')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('closed-reservations-table').tBodies[0];
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => console.error('Error:', error));

fetch('/borrowed_books_active')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('active-borrowed-books-table').tBodies[0];
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => console.error('Error:', error));

fetch('/borrowed_books_closed')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('closed-borrowed-books-table').tBodies[0];
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => console.error('Error:', error));


fetch('/available_books')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('available-books-table').tBodies[0];
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => console.error('Error:', error));