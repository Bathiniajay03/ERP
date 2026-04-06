import api from "./apiClient";

export const packerApi = {
  // Get all packers
  getAllPackers: () =>
    api.get("/packers"),

  // Get active packers
  getActivePackers: () =>
    api.get("/packers?isActive=true"),

  // Get packer by ID
  getPackerById: (id) =>
    api.get(`/packers/${id}`),

  // Create new packer
  createPacker: (payload) =>
    api.post("/packers", payload),

  // Update packer
  updatePacker: (id, payload) =>
    api.put(`/packers/${id}`, payload),

  // Delete packer
  deletePacker: (id) =>
    api.delete(`/packers/${id}`),

  // Deactivate packer
  deactivatePacker: (id) =>
    api.patch(`/packers/${id}/deactivate`),

  // Assign packer to order
  assignPackerToOrder: (packerId, orderId) =>
    api.post(`/packers/${packerId}/assign-order`, { orderId }),

  // Unassign packer from order
  unassignPackerFromOrder: (packerId) =>
    api.post(`/packers/${packerId}/unassign-order`)
};
