import { Task } from "../models/Task";

export function initializeTaskManager(userLogin) {
    const readyContainer = document.getElementById("readyTasks");
    const inProgressContainer = document.getElementById("inProgressTasks");
    const finishedContainer = document.getElementById("finishedTasks");

    const addButtonReady = document.getElementById("addToReady");
    const addButtonInProgress = document.getElementById("addToInProgress");

    let inputElement = null;
    let dropdownElement = null;
    let isEditingFinished = false;

    addButtonReady.addEventListener("click", () => {
        if (!inputElement) {
            createInputField(readyContainer, addButtonReady);
        }
    });

    function createInputField(container, button) {
        inputElement = document.createElement("input");
        inputElement.type = "text";
        container.appendChild(inputElement);
        inputElement.focus();

        button.textContent = "Submit";

        inputElement.removeEventListener("blur", finishEdit); // Удаляем старый обработчик перед добавлением
        inputElement.addEventListener("blur", finishEdit);
        inputElement.removeEventListener("keypress", handleKeyPress); // Удаляем старый обработчик
        inputElement.addEventListener("keypress", (event) => handleKeyPress(event, container, button)); // Добавляем новый
    }

    function handleKeyPress(event, container, button) {
        if (event.key === "Enter") {
            finishEdit(container, button);
            event.preventDefault(); // Предотвращаем дальнейшие действия по умолчанию
        }
    }

    function finishEdit(container, button) {
        if (!inputElement || isEditingFinished) return;

        isEditingFinished = true; // Защита от повторного запуска

        const taskContent = inputElement.value.trim();
        if (taskContent) {
            const task = new Task(taskContent, "", userLogin);
            Task.save(task);

            const taskElement = document.createElement("p");
            taskElement.textContent = taskContent;
            container.appendChild(taskElement);
        }

        // Удаление input, проверяем наличие в родителе
        if (container.contains(inputElement)) {
            container.removeChild(inputElement);
        }

        inputElement = null;
        button.textContent = "+ Add card";
        button.disabled = true;

        setTimeout(() => {
            button.disabled = false; // Включаем кнопку снова через 1 секунду
        }, 1000);
        setTimeout(() => {
            isEditingFinished = false; // Сбрасываем флаг для дальнейших операций
        }, 0);
    }

    addButtonInProgress.addEventListener("click", () => {
        createSelectDropdown();
    });

    function createSelectDropdown() {
        if (dropdownElement) {
            inProgressContainer.removeChild(dropdownElement);
        }

        dropdownElement = document.createElement("select");
         // Заполнение дропдауна задачами из Ready
        const tasks = Array.from(readyContainer.getElementsByTagName("p"));
        tasks.forEach(task => {
            const option = document.createElement("option");
            option.value = task.textContent;
            option.textContent = task.textContent;
            dropdownElement.appendChild(option);
        });

        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit";
        submitButton.addEventListener("click", () => {
            const selectedTask = dropdownElement.value;
            if (selectedTask) {
                moveToInProgress(selectedTask);
                inProgressContainer.removeChild(dropdownElement);
                inProgressContainer.removeChild(submitButton);
            }
        });

        inProgressContainer.appendChild(dropdownElement);
        inProgressContainer.appendChild(submitButton);
        addButtonInProgress.textContent = "Submit";
    }

    function moveToInProgress(taskTitle) {
        // Создаем элемент в In Progress
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        inProgressContainer.appendChild(taskElement);

        // Удаление задачи из Ready, но не из localStorage
        const readyTasks = Array.from(readyContainer.getElementsByTagName("p"));
        const taskToRemove = readyTasks.find(task => task.textContent === taskTitle);
        if (taskToRemove) {
            readyContainer.removeChild(taskToRemove);
        }
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
