/**
 * Shared Axios client configuration for backend communication.
 */

import axios from "axios";

import { getApiBase } from "./env";

export const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
