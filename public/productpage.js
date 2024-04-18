const form = document.querySelector("form");
    const messageInput = document.querySelector("#form-details textarea");

    // Function to display error messages
    const showError = (field, errorText) => {
        field.classList.add("error");
        const errorElement = document.createElement("small");
        errorElement.classList.add("error-text");
        errorElement.innerText = errorText;
        field.closest(".form-group").appendChild(errorElement);
    };

    // Function to handle form submission
    const handleFormSubmission = async (e) => {
        e.preventDefault();

        // Getting trimmed value from the textarea
        const message = messageInput.value.trim();

        // Clearing previous error messages
        document.querySelectorAll(".form-group .error").forEach(field => field.classList.remove("error"));
        document.querySelectorAll(".error-text").forEach(errorText => errorText.remove());

        // Performing validation checks
        if (message === "") {
            showError(messageInput, "Enter your message");
            return;
        }

        // Submitting the form using fetch
        try {
            const response = await fetch("/submitMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    message,
                }),
            });

            if (!response.ok) {
                throw new Error("Server error");
            }

            // Handle the response if needed

        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    // Handling form submission event
    form.addEventListener("submit", handleFormSubmission);