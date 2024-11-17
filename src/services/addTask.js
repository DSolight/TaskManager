import { Task } from "../models/Task";

export function initializeTaskManager(userLogin) {
    const readyContainer = document.getElementById("readyTasks");
    const inProgressContainer = document.getElementById("inProgressTasks");
    const finishedContainer = document.getElementById("finishedTasks");

    const addButtonReady = document.getElementById("addToReady");
    const addButtonInProgress = document.getElementById("addToInProgress");
    const addButtonFinished = document.getElementById("addToFinished");

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
        inputElement.addEventListener("blur", () =>
            finishEdit(container, button)
        );
        inputElement.removeEventListener("keypress", handleKeyPress); // Удаляем старый обработчик
        inputElement.addEventListener("keypress", (event) =>
            handleKeyPress(event, container, button)
        ); // Добавляем новый
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
            button.disabled = false; // Включаем кнопку снова
        }, 500);

        updateButtonState();
    }

    // Обработчик для кнопки добавления в In Progress
    addButtonInProgress.addEventListener("click", () => {
        if (!dropdownElement) {
            createDropdown(inProgressContainer, addButtonInProgress);
        } // Создание нового дропдауна
    });

    function createDropdown(container, button) {
        if (dropdownElement) {
            removeDropdown(); // Убираем предыдущий дропдаун, если он есть
        }

        dropdownElement = document.createElement("select"); // Отображаем дропдаун
        dropdownElement.focus();
        // Заполнение дропдауна задачами из Ready
        const tasks = Array.from(readyContainer.getElementsByTagName("p"));
        tasks.forEach((task) => {
            const option = document.createElement("option");
            option.value = task.textContent;
            option.textContent = task.textContent;
            dropdownElement.appendChild(option);
        });

        // Меняем текст кнопки на "Submit"
        button.textContent = "Submit";

        // Убираем старый обработчик и добавляем новый
        button.removeEventListener("click", handleAddTask); // Убираем старый обработчик
        button.addEventListener("click", handleAddTask); // Добавляем новый

        container.appendChild(dropdownElement);
    }

    function handleAddTask() {
        const selectedTask = dropdownElement.value;
        if (selectedTask) {
            dropdownElement.addEventListener("blur", () => {
                // Используем setTimeout, чтобы избежать ошибки удаления
                setTimeout(removeDropdown, 0);
            });
            dropdownElement.removeEventListener("blur", removeDropdown);
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

    document.addEventListener("mousedown", (event) => {
        if (
            dropdownElement &&
            !dropdownElement.contains(event.target) &&
            !addButtonInProgress.contains(event.target)
        ) {
            removeDropdown();
        }
    });

    function moveToInProgress(taskTitle) {
        // Создаем элемент в In Progress
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        inProgressContainer.appendChild(taskElement);

        // Обновляем статус задачи
        Task.updateTaskStatus(taskTitle, userLogin, "inProgress"); // Обновляем статус задачи

        // Удаляем задачу из блока Ready
        const readyTasks = Array.from(readyContainer.getElementsByTagName("p"));
        const taskToRemove = readyTasks.find(
            (task) => task.textContent === taskTitle
        );
        if (taskToRemove) {
            readyContainer.removeChild(taskToRemove);
        }

        updateButtonState(); // Обновляем состояние кнопок
    }

    // Обработчик для кнопки добавления в Finished
    addButtonFinished.addEventListener("click", () => {
        if (!dropdownElement) {
            createFinishedDropdown(finishedContainer, addButtonFinished);
        }
    });

    function createFinishedDropdown(container, button) {
        if (dropdownElement) {
            removeFinishedDropdown();
        }

        dropdownElement = document.createElement("select"); // Создаем дропдаун
        dropdownElement.focus();

        // Заполнение дропдауна задачами из In Progress
        const tasks = Array.from(inProgressContainer.getElementsByTagName("p"));
        tasks.forEach((task) => {
            const option = document.createElement("option");
            option.value = task.textContent;
            option.textContent = task.textContent;
            dropdownElement.appendChild(option);
        });

        // Меняем текст кнопки на "Submit"
        button.textContent = "Submit";

        // Убираем старый обработчик и добавляем новый
        button.removeEventListener("click", handleAddFinishedTask);
        button.addEventListener("click", handleAddFinishedTask);

        container.appendChild(dropdownElement);
    }

    function handleAddFinishedTask() {
        const selectedTask = dropdownElement.value;
        if (selectedTask) {
            moveToFinished(selectedTask); // Добавляем задачу в блок finished
            removeFinishedDropdown(); // Убираем дропдаун после выбора
        }
    }

    function moveToFinished(taskTitle) {
        // Создаем элемент в Finished
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        finishedContainer.appendChild(taskElement);

        // Обновляем статус задачи
        Task.updateTaskStatus(taskTitle, userLogin, "finished"); // Обновляем статус задачи

        // Удаляем задачу из блока In Progress
        const inProgressTasks = Array.from(
            inProgressContainer.getElementsByTagName("p")
        );
        const taskToRemove = inProgressTasks.find(
            (task) => task.textContent === taskTitle
        );
        if (taskToRemove) {
            inProgressContainer.removeChild(taskToRemove);
        }

        updateButtonState(); // Обновляем состояние кнопок
    }

    function removeFinishedDropdown() {
        if (dropdownElement && finishedContainer.contains(dropdownElement)) {
            finishedContainer.removeChild(dropdownElement);
        }
        dropdownElement = null; // Сбрасываем ссылку на дропдаун
        addButtonFinished.textContent = "+ Add card"; // Возвращаем кнопке стандартное название
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

        // Обновляем состояние кнопки для Finished
        const inProgressTasks = inProgressContainer.getElementsByTagName("p");
        const hasTasksInProgress = inProgressTasks.length > 0;

        if (hasTasksInProgress) {
            addButtonFinished.classList.remove("button-disabled");
            addButtonFinished.classList.add("button-active");
            addButtonFinished.disabled = false; // Включаем кнопку, если есть задачи в In Progress
        } else {
            addButtonFinished.classList.add("button-disabled");
            addButtonFinished.classList.remove("button-active");
            addButtonFinished.disabled = true; // Отключаем кнопку, если нет задач в In Progress
        }
    }

    function loadTasks(userLogin) {
        const tasks = Task.getTasksByUser(userLogin);
        tasks.forEach((task) => {
            const taskElement = document.createElement("p");
            taskElement.textContent = task.title;

            if (task.status === "ready") {
                readyContainer.appendChild(taskElement); // Добавляем в Ready
            } else if (task.status === "inProgress") {
                inProgressContainer.appendChild(taskElement); // Добавляем в In Progress
            } else if (task.status === "finished") {
                finishedContainer.appendChild(taskElement); // Добавляем в Finished
            }
        });
        updateButtonState();
    }

    // Вызов функции в инициализации
    loadTasks(userLogin);
}
