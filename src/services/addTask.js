import { Task } from "../models/Task";
import { updateTaskCount } from "./updateTaskCount";

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
            taskElement.setAttribute("draggable", "true");
            taskElement.classList.add("draggable");
            taskElement.setAttribute("data-task", taskContent);
            container.appendChild(taskElement);

            taskElement.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", taskElement.textContent);
                e.dataTransfer.effectAllowed = "move"; // Разрешаем перемещение
            });
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
        updateTaskCount(userLogin);
    }

    // Обработчик для кнопки добавления в In Progress
    addButtonInProgress.addEventListener("click", () => {
        if (!dropdownElement) {
            createDropdown(
                inProgressContainer,
                addButtonInProgress,
                readyContainer
            ); // Заполнение из контейнера Ready
        }
    });

    addButtonFinished.addEventListener("click", () => {
        if (!dropdownElement) {
            createDropdown(
                finishedContainer,
                addButtonFinished,
                inProgressContainer
            ); // Заполнение из контейнера In Progress
        }
    });

    function createDropdown(container, button, taskSource) {
        if (dropdownElement) {
            removeDropdown(container, button); // Убираем предыдущий дропдаун, если он есть
        }

        dropdownElement = document.createElement("select"); // Отображаем дропдаун
        dropdownElement.focus();

        // Заполнение дропдауна задачами из указанного источника
        const tasks = Array.from(taskSource.getElementsByTagName("p"));
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
            const allTasks = Task.getTasksByUser(userLogin);
            const selectedTaskObj = allTasks.find(
                (task) => task.title === selectedTask
            );

            if (selectedTaskObj) {
                if (selectedTaskObj.status === "ready") {
                    moveToInProgress(selectedTaskObj.title);
                } else if (selectedTaskObj.status === "inProgress") {
                    moveToFinished(selectedTaskObj.title);
                }
            }

            if (selectedTaskObj && selectedTaskObj.status === "ready") {
                removeDropdown(inProgressContainer, addButtonInProgress);
            } else if (
                selectedTaskObj &&
                selectedTaskObj.status === "inProgress"
            ) {
                removeDropdown(finishedContainer, addButtonFinished);
            }
        }

        updateTaskCount(userLogin);
    }

    function removeDropdown(container, button) {
        if (dropdownElement && container.contains(dropdownElement)) {
            container.removeChild(dropdownElement);
        }
        dropdownElement = null; // Сбрасываем ссылку на дропдаун
        button.textContent = "+ Add card"; // Возвращаем кнопке стандартное название
    }

    // Использование функции removeDropdown в обработчиках
    document.addEventListener("mousedown", (event) => {
        if (
            dropdownElement &&
            !dropdownElement.contains(event.target) &&
            !addButtonInProgress.contains(event.target) &&
            !addButtonFinished.contains(event.target) // Учтите кнопку Finished
        ) {
            removeDropdown(inProgressContainer, addButtonInProgress); // Удаление из In Progress
            removeDropdown(finishedContainer, addButtonFinished); // Удаление из Finished
        }
    });

    function moveToInProgress(taskTitle) {
        // Создаем элемент в In Progress
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        taskElement.setAttribute("draggable", "true");
        taskElement.classList.add("draggable");
        taskElement.setAttribute("data-task", taskTitle);

        inProgressContainer.appendChild(taskElement);

    // Устанавливаем обработчик dragstart
        taskElement.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", taskElement.textContent);
            e.dataTransfer.effectAllowed = "move"; // Разрешаем перемещение
        });

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
        updateTaskCount(userLogin); // Обновляем счетчик задач
    }

    function moveToFinished(taskTitle) {
        // Создаем элемент в Finished
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        taskElement.setAttribute("draggable", "true");
        taskElement.classList.add("draggable");
        taskElement.setAttribute("data-task", taskTitle);

        finishedContainer.appendChild(taskElement);
        // Устанавливаем обработчик dragstart
        taskElement.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", taskElement.textContent);
            e.dataTransfer.effectAllowed = "move"; // Разрешаем перемещение
        });

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
        updateTaskCount(userLogin);
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
            taskElement.setAttribute("draggable", "true");
            taskElement.classList.add("draggable");
            taskElement.setAttribute("data-task", task.title); // Устанавливаем data-task

            // Устанавливаем обработчик dragstart
            taskElement.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", taskElement.textContent);
                e.dataTransfer.effectAllowed = "move"; // Разрешаем перемещение
            });

            if (task.status === "ready") {
                readyContainer.appendChild(taskElement); // Добавляем в Ready
            } else if (task.status === "inProgress") {
                inProgressContainer.appendChild(taskElement); // Добавляем в In Progress
            } else if (task.status === "finished") {
                finishedContainer.appendChild(taskElement); // Добавляем в Finished
            }
        });

        updateButtonState();
        updateTaskCount(userLogin);
    }

    function initializeDragAndDrop() {
        const containers = [
            document.getElementById("readyTasks"),
            document.getElementById("inProgressTasks"),
            document.getElementById("finishedTasks"),
        ];

        containers.forEach((container) => {
            container.addEventListener("dragover", (e) => {
                e.preventDefault(); // Позволяем сбрасывать элементы
            });

            container.addEventListener("drop", (e) => {
                e.preventDefault();
                const taskTitle = e.dataTransfer.getData("text/plain"); // Получаем название задачи
                const taskElement = document.querySelector(`p[data-task="${taskTitle}"]`); // Находим элемент задачи

                if (taskElement) {
                    // Перемещаем задачу в новый контейнер
                    container.appendChild(taskElement);

                    // Обновляем статус задачи в модели
                    if (container.id === "readyTasks") {
                        Task.updateTaskStatus(taskTitle, userLogin, "ready");
                    } else if (container.id === "inProgressTasks") {
                        Task.updateTaskStatus(taskTitle, userLogin, "inProgress");
                    } else if (container.id === "finishedTasks") {
                        Task.updateTaskStatus(taskTitle, userLogin, "finished");
                    }
                    updateTaskCount(userLogin);
                }
            });
        });
         // Обновляем счетчик задач
    }

        // Вызов функции в инициализации
        loadTasks(userLogin);
        initializeDragAndDrop();
    }
