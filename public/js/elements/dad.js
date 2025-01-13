const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
let uploadedFile = null; // Переменная для хранения данных загруженного файла

// Open file dialog when drop area is clicked
dropArea.addEventListener('click', () => {
    fileInput.click();
});

// Prevent default behaviors for drag events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false); // Preventing default on body
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight the drop area when dragging files over it
dropArea.addEventListener('dragover', () => {
    dropArea.classList.add('hover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('hover');
});

// Handle dropped files
dropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;

    handleFiles(files);
});

// Handle file selection from input
fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            imagePreview.src = e.target.result; // Set preview source
            imagePreview.style.display = 'block'; // Show the preview
            dropArea.querySelector('p').style.display = 'none'; // Hide instructions
        };

        reader.readAsDataURL(file); // Read the file as data URL

        uploadedFile = file; // Сохраняем файл в переменную
        dropArea.classList.remove('hover'); // Убираем hover-эффект после загрузки
    }
}