import { BaseModel } from "./BaseModel";
import { getFromStorage, addToStorage } from "../utils";

export class Task extends BaseModel {
    constructor(title, description, userLogin) {
        super();
        this.title = title;
        this.description = description;
        this.userLogin = userLogin;
        this.storageKey = "tasks";
    }

    static save(task) {
        try {
            addToStorage(task, task.storageKey);
            return true;
        } catch (e) {
            throw new Error(e);
        }
    }

    static getTasksByUser(userLogin) {
        const tasks = getFromStorage("tasks") || [];
        return tasks.filter(task => task.userLogin === userLogin);
    }

    static deleteTask(taskTitle, userLogin) {
        const tasks = getFromStorage("tasks") || [];
        const updatedTasks = tasks.filter(task => !(task.title === taskTitle && task.userLogin === userLogin));
        localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    }

}
