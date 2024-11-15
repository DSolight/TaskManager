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

    updateButtonState();

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
        inputElement.addEventListener("blur", () => finishEdit(container, button));
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
            isEditingFinished = false; // Сбрасываем флаг для дальнейших операций
        }, 0);
        setTimeout(() => {
            button.disabled = false; // Включаем кнопку снова через 1 секунду
        }, 1000);

        updateButtonState();
    }

    // Обработчик для кнопки добавления в In Progress
addButtonInProgress.addEventListener("click", () => {
    createDropdown(); // Создание нового дропдауна
});

function createDropdown() {
    // Проверяем, существует ли уже дропдаун и удаляем его если это так
    if (dropdownElement) {
        removeDropdown(); // Удалим предыдущий дропдаун, если он был
    }

    dropdownElement = document.createElement("select");
    dropdownElement.style.display = "block";

    // Заполнение дропдауна задачами из Ready
    const tasks = Array.from(readyContainer.getElementsByTagName("p"));
    tasks.forEach(task => {
        const option = document.createElement("option");
        option.value = task.textContent;
        option.textContent = task.textContent;
        dropdownElement.appendChild(option);
    });

    // Меняем текст кнопки на "Submit"
    addButtonInProgress.textContent = "Submit";

    // Добавление обработчика для добавления задачи
    addButtonInProgress.removeEventListener("click", handleAddTask); // Убираем старый обработчик, если он существует
    addButtonInProgress.addEventListener("click", handleAddTask);

    inProgressContainer.appendChild(dropdownElement);
}

function handleAddTask() {
    const selectedTask = dropdownElement.value;
    if (selectedTask) {
        moveToInProgress(selectedTask); // Добавляем задачу в блок In Progress
        removeDropdown(); // Убираем дропдаун после выбора
    }
}

    function removeDropdown() {
        if (dropdownElement && inProgressContainer.contains(dropdownElement)) {
            inProgressContainer.removeChild(dropdownElement);
        }
        dropdownElement = null; // Сбрасываем ссылку на дропдаун
        addButtonInProgress.textContent = "+ Add card"; // Возвращаем кнопке стандартное название
    }

    function moveToInProgress(taskTitle) {
        // Создаем элемент в In Progress
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        inProgressContainer.appendChild(taskElement);

        // Удаление задачи из Ready (не из localStorage)
        const readyTasks = Array.from(readyContainer.getElementsByTagName("p"));
        const taskToRemove = readyTasks.find(task => task.textContent === taskTitle);
        if (taskToRemove) {
            readyContainer.removeChild(taskToRemove);
        }

        updateButtonState(); // Обновляем состояние кнопок
    }

    function updateButtonState() {
        const readyTasks = readyContainer.getElementsByTagName("p");
        const hasTasksInReady = readyTasks.length > 0;

        // Обновляем состояние кнопки для In Progress
        if (hasTasksInReady) {
            addButtonInProgress.classList.remove("button-disabled");
            addButtonInProgress.classList.add("button-active");
            addButtonInProgress.disabled = false;
        } else {
            addButtonInProgress.classList.add("button-disabled");
            addButtonInProgress.classList.remove("button-active");
            addButtonInProgress.disabled = true; // Отключаем кнопку если нет задач в Ready
        }
    }

    function loadTasks(userLogin) {
        const tasks = Task.getTasksByUser(userLogin);
        tasks.forEach((task) => {
            const taskElement = document.createElement("p");
            taskElement.textContent = task.title;
            readyContainer.appendChild(taskElement);
        });
    }



    loadTasks(userLogin);
    updateButtonState()
}

/* 
function loadTasks(userLogin) {
    const tasks = Task.getTasksByUser(userLogin);
    tasks.forEach((task) => {
        const taskElement = document.createElement("p");
        taskElement.textContent = task.title;
        document.querySelector(".todo-item__task").appendChild(taskElement);
    });
}
*/