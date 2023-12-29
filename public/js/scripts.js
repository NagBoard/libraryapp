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
            const fields = ['librarian_username', 'title', 'author', 'status', 'request_date', 'confirmation_date', 'last_status_update'];
            fields.forEach(field => {
                const td = document.createElement('td');
                td.textContent = row[field];
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
        const fields = ['librarian_username', 'title', 'author', 'status', 'request_date', 'confirmation_date', 'last_status_update'];
        fields.forEach(field => {
            const td = document.createElement('td');
            td.textContent = row[field];
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
        const fields = ['id', 'issuer_username', 'receiver_username', 'title', 'author', 'status', 'borrow_date', 'return_date'];
        fields.forEach(field => {
            const td = document.createElement('td');
            td.textContent = row[field];
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
        const fields = ['id', 'issuer_username', 'receiver_username', 'title', 'author', 'status', 'borrow_date', 'return_date'];
        fields.forEach(field => {
            const td = document.createElement('td');
            td.textContent = row[field];
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
})
.catch(error => console.error('Error:', error));


function fetchAndPopulateTable() {
    fetch('/available_books')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('available-books-table').tBodies[0];
        // Clear the table body
        tableBody.innerHTML = '';
        data.forEach(row => {
            // Only process rows where available_copies is greater than 0
            if (row.available_copies > 0) {
                const tr = document.createElement('tr');
                ['title', 'author', 'description', 'book_type', 'available_copies'].forEach(key => {
                    const td = document.createElement('td');
                    td.textContent = row[key];
                    tr.appendChild(td);
                });
                const buttonTd = document.createElement('td');
                const button = document.createElement('button');
                button.textContent = 'Reserve';
                button.dataset.bookId = row.book_id;
                button.dataset.readerId = row.reader_id;
                button.onclick = function() {
                const bookId = this.dataset.bookId;
                const readerId = this.dataset.readerId;
                const date = new Date();
                const requestDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`;
                fetch('/create_reservation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        book_id: bookId,
                        reader_id: readerId,
                        request_date: requestDate,
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    // Decrement the available_copies field of the book record
                    fetch(`/decrement_book/${bookId}`, {
                        method: 'POST',
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Book count decremented:', data);
                        fetchAndPopulateTable(); // Fetch and populate the table again
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            };
            buttonTd.appendChild(button);
            tr.appendChild(buttonTd);
            tableBody.appendChild(tr);
        }
    });
})
.catch(error => console.error('Error:', error));
}

// Call the function initially to populate the table
fetchAndPopulateTable();


// Fetch the book data from your server
fetch('/books')
.then(response => response.json())
.then(data => {
    const tableBody = document.getElementById('book-table').tBodies[0];
    data.forEach(book => {
        const tr = document.createElement('tr');
        tr.id = `book-${book.id}`; // Assign an ID to the table row
        ['title', 'author', 'description', 'available_copies', 'total_copies'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = book[key];
            tr.appendChild(td);
        });
        // Add buttons for editing and deleting
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = function() {
                // Create a form for editing the book
        const form = document.createElement('form');
        ['title', 'author', 'description', 'available_copies', 'total_copies'].forEach(key => {
            const label = document.createElement('label');
            label.textContent = key;
            const input = document.createElement('input');
            input.name = key; // Set the name attribute
            input.value = book[key];
            form.appendChild(label);
            form.appendChild(input);
        });

        // Create a save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        form.appendChild(saveButton);

        // Create a cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = function(e) {
            e.preventDefault();
            form.remove(); // Remove the form from the DOM
        };
        form.appendChild(cancelButton);

        // Handle form submission
        form.onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedBook = Object.fromEntries(formData.entries());
            updateBook(book.id, updatedBook);
            form.remove(); // Remove the form from the DOM
        };

        // Display the form to the user
        document.body.appendChild(form);
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = function() {
            // Handle deleting the book
            deleteBook(book.id);
        };
        tr.appendChild(editButton);
        tr.appendChild(deleteButton);
        tableBody.appendChild(tr);
    });
});

// Handle adding a new book
document.getElementById('add-book').onclick = function() {
    const form = document.getElementById('add-book-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const newBook = Object.fromEntries(formData.entries());

        fetch('/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newBook),
        })
        .then(response => {
            if (response.ok) {
                console.log('Book added successfully');
            } else {
                console.error('Error adding book:', response.status);
            }
        })
        .catch(error => console.error('Error adding book:', error));
    };
};

function updateBook(bookId, updatedBook) {
    console.log('Data sent from user:', updatedBook);

    fetch(`/books/${bookId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBook),
    })
    .then(response => {
        if (response.ok) {
            // Book updated successfully, update the corresponding row in the table
            const tableRow = document.getElementById(`book-${bookId}`);
            ['title', 'author', 'description', 'available_copies', 'total_copies'].forEach((key, i) => {
                tableRow.children[i].textContent = updatedBook[key];
            });
        } else {
            console.error('Error updating book:', response.status);
        }
    })
    .catch(error => console.error('Error updating book:', error));
}

function deleteBook(bookId) {
    // Send a DELETE request to the server to delete the book with the given ID
    fetch(`/books/${bookId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            // Book deleted successfully, remove the corresponding row from the table
            const tableRow = document.getElementById(`book-${bookId}`);
            tableRow.remove();
        } else {
            console.error('Error deleting book:', response.status);
        }
    })
    .catch(error => console.error('Error deleting book:', error));
}
