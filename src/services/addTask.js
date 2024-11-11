import { Task } from "../models/Task";

export function initializeTaskManager(userLogin) {
    const readyContainer = document.querySelector(".todo-item__task");
    const addButton = document.querySelector(".todo-item__button-add");

    let inputElement = null;

    addButton.addEventListener("click", () => {
        if (!inputElement) {
            createInputField();
        }
    });

    function createInputField() {
        inputElement = document.createElement("input");
        inputElement.type = "text";
        readyContainer.appendChild(inputElement);
        inputElement.focus();

        addButton.textContent = "Submit";

        inputElement.removeEventListener("blur", finishEdit); // Удаляем старый обработчик перед добавлением
        inputElement.addEventListener("blur", finishEdit);
        inputElement.removeEventListener("keypress", handleKeyPress); // Удаляем старый обработчик
        inputElement.addEventListener("keypress", handleKeyPress); // Добавляем новый
    }

    function handleKeyPress(event) {
        if (event.key === "Enter") {
            finishEdit();
            event.preventDefault(); // Предотвращаем дальнейшие действия по умолчанию
        }
    }

    let isEditingFinished = false;

    function finishEdit() {
        if (!inputElement || isEditingFinished) return;

        isEditingFinished = true; // Защита от повторного запуска

        const taskContent = inputElement.value.trim();
        if (taskContent) {
            const task = new Task(taskContent, "", userLogin);
            Task.save(task);

            const taskElement = document.createElement("p");
            taskElement.textContent = taskContent;
            readyContainer.appendChild(taskElement);
        }

        // Удаление input, проверяем наличие в родителе
        if (readyContainer.contains(inputElement)) {
            readyContainer.removeChild(inputElement);
        }

        inputElement = null;
        addButton.textContent = "+ Add card";
        addButton.disabled = true;

        setTimeout(() => {
            addButton.disabled = false; // Включаем кнопку снова через 1 секунду
        }, 1000);
        setTimeout(() => {
            isEditingFinished = false; // Сбрасываем флаг для дальнейших операций
        }, 0);
    }

    loadTasks(userLogin);
}

function loadTasks(userLogin) {
    const tasks = Task.getTasksByUser(userLogin);
    tasks.forEach((task) => {
        const taskElement = document.createElement("p");
        taskElement.textContent = task.title;
        document.querySelector(".todo-item__task").appendChild(taskElement);
    });
}
