import { api } from "./api.ts";

api.importJobs.createImportJob;
api.importJobs.getImportJob;

// @ts-expect-error bridge must reject unknown function names.
api.importJobs.notARealFunction;

// @ts-expect-error bridge must reject unknown module names.
api.notARealModule.getImportJob;
