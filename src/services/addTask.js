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

        inputElement.removeEventListener("blur", finishEdit);
        inputElement.addEventListener("blur", () => finishEdit(container, button));
        inputElement.removeEventListener("keypress", handleKeyPress);
        inputElement.addEventListener("keypress", (event) => handleKeyPress(event, container, button));
    }

    function handleKeyPress(event, container, button) {
        if (event.key === "Enter") {
            finishEdit(container, button);
            event.preventDefault();
        }
    }

    function finishEdit(container, button) {
        if (!inputElement || isEditingFinished) return;

        isEditingFinished = true;

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
                e.dataTransfer.effectAllowed = "move";
            });

            // Добавляем обработчики для dragover и drop
            initializeDragAndDrop(container);
        }

        if (container.contains(inputElement)) {
            container.removeChild(inputElement);
        }

        inputElement = null;
        button.textContent = "+ Add card";
        button.disabled = true;

        setTimeout(() => {
            isEditingFinished = false;
        }, 0);
        setTimeout(() => {
            button.disabled = false;
        }, 500);

        updateButtonState();
        updateTaskCount(userLogin);
    }

    // Обработчик для кнопки добавления в In Progress
    addButtonInProgress.addEventListener("click", () => {
        if (!dropdownElement) {
            createDropdown(inProgressContainer, addButtonInProgress, readyContainer);
        }
    });

    addButtonFinished.addEventListener("click", () => {
        if (!dropdownElement) {
            createDropdown(finishedContainer, addButtonFinished, inProgressContainer);
        }
    });

    function createDropdown(container, button, taskSource) {
        if (dropdownElement) {
            removeDropdown(container, button);
        }

        dropdownElement = document.createElement("select");
        dropdownElement.focus();

        const tasks = Array.from(taskSource.getElementsByTagName("p"));
        tasks.forEach((task) => {
            const option = document.createElement("option");
            option.value = task.textContent;
            option.textContent = task.textContent;
            dropdownElement.appendChild(option);
        });

        button.textContent = "Submit";
        button.removeEventListener("click", handleAddTask);
        button.addEventListener("click", handleAddTask);
        container.appendChild(dropdownElement);
    }

    function handleAddTask() {
        const selectedTask = dropdownElement.value;
        if (selectedTask) {
            const allTasks = Task.getTasksByUser (userLogin);
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
            } else if (selectedTaskObj && selectedTaskObj.status === "inProgress") {
                removeDropdown(finishedContainer, addButtonFinished);
            }
        }

        updateTaskCount(userLogin);
    }

    function removeDropdown({
        containers = [finishedContainer, inProgressContainer],
        buttons = [addButtonFinished, addButtonInProgress]
    } = {}) {
        if (dropdownElement) {
            containers.forEach((container, index) => {
                if (container.contains(dropdownElement)) {
                    container.removeChild(dropdownElement);
                    buttons[index].textContent = "+ Add card";
                }
            });
            dropdownElement = null;
        }
    }

    document.addEventListener("mousedown", (event) => {
        if (dropdownElement) {
            if (
                !dropdownElement.contains(event.target) &&
                !addButtonInProgress.contains(event.target) &&
                !addButtonFinished.contains(event.target)
            ) {
                removeDropdown();
            }
        }
    });

    function moveToInProgress(taskTitle) {
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        taskElement.setAttribute("draggable", "true");
        taskElement.classList.add("draggable");
        taskElement.setAttribute("data-task", taskTitle);

        inProgressContainer.appendChild(taskElement);

        taskElement.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", taskElement.textContent);
            e.dataTransfer.effectAllowed = "move";
        });

        Task.updateTaskStatus(taskTitle, userLogin, "inProgress");

        const readyTasks = Array.from(readyContainer.getElementsByTagName("p"));
        const taskToRemove = readyTasks.find(
            (task) => task.textContent === taskTitle
        );
        if (taskToRemove) {
            readyContainer.removeChild(taskToRemove);
        }

        updateButtonState();
        updateTaskCount(userLogin);
    }

    function moveToFinished(taskTitle) {
        const taskElement = document.createElement("p");
        taskElement.textContent = taskTitle;
        taskElement.setAttribute("draggable", "true");
        taskElement.classList.add("draggable");
        taskElement.setAttribute("data-task", taskTitle);

        finishedContainer.appendChild(taskElement);

        taskElement.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", taskElement.textContent);
            e.dataTransfer.effectAllowed = "move";
        });

        Task.updateTaskStatus(taskTitle, userLogin, "finished");

        const inProgressTasks = Array.from(inProgressContainer.getElementsByTagName("p"));
        const taskToRemove = inProgressTasks.find(
            (task) => task.textContent === taskTitle
        );
        if (taskToRemove) {
            inProgressContainer.removeChild(taskToRemove);
        }

        updateButtonState();
        updateTaskCount(userLogin);
    }

    function updateButtonState() {
        const readyTasks = readyContainer.getElementsByTagName("p");
        const hasTasksInReady = readyTasks.length > 0;

        if (hasTasksInReady) {
            addButtonInProgress.classList.remove("button-disabled");
            addButtonInProgress.classList.add("button-active");
            addButtonInProgress.disabled = false;
        } else {
            addButtonInProgress.classList.add("button-disabled");
            addButtonInProgress.classList.remove("button-active");
            addButtonInProgress.disabled = true;
        }

        const inProgressTasks = inProgressContainer.getElementsByTagName("p");
        const hasTasksInProgress = inProgressTasks.length > 0;

        if (hasTasksInProgress) {
            addButtonFinished.classList.remove("button-disabled");
            addButtonFinished.classList.add("button-active");
            addButtonFinished.disabled = false;
        } else {
            addButtonFinished.classList.add("button-disabled");
            addButtonFinished.classList.remove("button-active");
            addButtonFinished.disabled = true;
        }
    }

    function loadTasks(userLogin) {
        const tasks = Task.getTasksByUser (userLogin);
        tasks.forEach((task) => {
            const taskElement = document.createElement("p");
            taskElement.textContent = task.title;
            taskElement.setAttribute("draggable", "true");
            taskElement.classList.add("draggable");
            taskElement.setAttribute("data-task", task.title);

            taskElement.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", taskElement.textContent);
                e.dataTransfer.effectAllowed = "move";
            });

            if (task.status === "ready") {
                readyContainer.appendChild(taskElement);
            } else if (task.status === "inProgress") {
                inProgressContainer.appendChild(taskElement);
            } else if (task.status === "finished") {
                finishedContainer.appendChild(taskElement);
            }
        });

        updateButtonState();
        updateTaskCount(userLogin);
    }

    function initializeDragAndDrop() {
        const containers = [
            readyContainer,
            inProgressContainer,
            finishedContainer,
        ];
        containers.forEach((container) => {
            container.addEventListener("dragover", (e) => {
                e.preventDefault(); // Позволяем сбрасывать элементы
            });

            container.addEventListener("drop", (e) => {
                e.preventDefault();
                const taskTitle = e.dataTransfer.getData("text/plain");
                const taskElement = document.querySelector(`p[data-task="${taskTitle}"]`);

                if (taskElement) {
                    container.appendChild(taskElement);

                    if (container === readyContainer) {
                        Task.updateTaskStatus(taskTitle, userLogin, "ready");
                    } else if (container === inProgressContainer) {
                        Task.updateTaskStatus(taskTitle, userLogin, "inProgress");
                    } else if (container === finishedContainer) {
                        Task.updateTaskStatus(taskTitle, userLogin, "finished");
                    }
                    updateTaskCount(userLogin);
                }
            });
        });
    }

    loadTasks(userLogin);
    initializeDragAndDrop();
}