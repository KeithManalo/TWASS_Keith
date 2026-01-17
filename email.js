// Send email through EmailJS when contact form is submitted
function sendMail(e) {
    // Stop page from reloading
    e.preventDefault();
    
    // Get form values
    let parms = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value,
    };

    // Send email using EmailJS
    emailjs.send("service_qni0nzp", "template_bnle2vt", parms)
        .then(() => {
            // Show success message and clear form
            alert("Message sent successfully!");
            document.getElementById("contactForm").reset();
        })
        .catch((error) => {
            // Show error message
            alert("Failed to send message. Please try again.");
            console.error("EmailJS error:", error);
        });
}

// Setup form when page loads
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("contactForm").addEventListener("submit", sendMail);
});