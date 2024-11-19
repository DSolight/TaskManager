import { Task } from "../models/Task"; // Убедитесь, что у вас правильный путь к модели Task

export function draggableTask(userLogin) {
const containers = [document.getElementById("readyTasks"), document.getElementById("inProgressTasks"), document.getElementById("finishedTasks")];

containers.forEach(container => {
    container.addEventListener("dragover", (e) => {
        e.preventDefault(); // Позволяем сбрасывать элементы
    });

    container.addEventListener("drop", (e) => {
        e.preventDefault();
        const taskTitle = e.dataTransfer.getData("text/plain"); // Получаем элементы данных
        const taskElement = document.querySelector(`p[data-task="${taskTitle}"]`); // Находим элемент задачи по имени

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

            // Обновляем количество задач в футере
            const event = new Event("taskUpdated");
            document.dispatchEvent(event);
        }
    });
});

// Добавляем обработчики событий для задач
const taskElements = document.querySelectorAll("p[data-task]"); // Предполагаем, что у задач есть атрибут data-task
taskElements.forEach(task => {
    task.setAttribute("draggable", "true"); // Делаем элемент перетаскиваемым

    task.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", task.textContent); // Устанавливаем данные перетаскивания
        e.dataTransfer.effectAllowed = "move"; // Разрешаем перемещение
    });
});
}