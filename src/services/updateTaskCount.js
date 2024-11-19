import { Task } from "../models/Task"; // Убедитесь, что у вас есть правильный путь к модели Task

// Функция для обновления информации о задачах в футере
export function updateTaskCount(userLogin) {
    const allTasks = Task.getTasksByUser(userLogin); // Получаем все задачи

    // Подсчет активных и завершенных задач
    const activeCount = allTasks.filter(task => task.status === "ready").length;
    const finishedCount = allTasks.filter(task => task.status === "finished").length;

    // Обновление содержимого футера
    const activeTaskElement = document.querySelector(".active-task");
    const finishedTaskElement = document.querySelector(".finished-task");

    activeTaskElement.innerHTML = `<p>Active tasks: ${activeCount}</p>`;
    finishedTaskElement.innerHTML = `<p>Finished tasks: ${finishedCount}</p>`;
}