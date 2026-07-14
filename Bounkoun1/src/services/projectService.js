import { createProject, getProjectById, getAllProjects } from "../controllers/projectsController.js";

export async function handleCreateProject(body) {
  return await createProject(body);
}

export async function handleGetProject(id) {
  return await getProjectById(id);
}

export async function handleGetAllProjects() {
  return await getAllProjects();
}
