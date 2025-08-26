import prisma from "../../config/database.js";
import { requireAdmin } from "../../middleware/auth.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function adminFormFieldsRoutes(fastify, options) {
	fastify.addHook("preHandler", requireAdmin);

	// 獲取所有表單欄位
	fastify.get(
		"/form-fields",
		{
			schema: {
				description: "獲取所有表單欄位",
				tags: ["admin-form-fields"],
				querystring: {
					type: "object",
					properties: {
						page: { type: "integer", minimum: 1, default: 1 },
						limit: { type: "integer", minimum: 1, maximum: 100, default: 50 }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string" },
										name: { type: "string" },
										label: { type: "string" },
										type: { type: "string" },
										description: { type: "string", nullable: true },
										required: { type: "boolean" },
										order: { type: "integer" },
										options: { type: "string", nullable: true },
										validation: { type: "string", nullable: true },
										placeholder: { type: "string", nullable: true },
										helpText: { type: "string", nullable: true },
										isActive: { type: "boolean" },
										createdAt: { type: "string", format: "date-time" },
										updatedAt: { type: "string", format: "date-time" },
										ticketFields: {
											type: "array",
											items: {
												type: "object",
												properties: {
													id: { type: "string" },
													isRequired: { type: "boolean" },
													isVisible: { type: "boolean" },
													order: { type: "integer" },
													ticket: {
														type: "object",
														properties: {
															id: { type: "string" },
															name: { type: "string" }
														}
													}
												}
											}
										}
									}
								}
							},
							pagination: {
								type: "object",
								properties: {
									page: { type: "integer" },
									limit: { type: "integer" },
									total: { type: "integer" },
									totalPages: { type: "integer" }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { page = 1, limit = 50 } = request.query;
				const skip = (page - 1) * limit;

				const [formFields, total] = await Promise.all([
					prisma.formField.findMany({
						where: { isActive: true },
						skip,
						take: parseInt(limit),
						include: {
							ticketFields: {
								include: {
									ticket: {
										select: { id: true, name: true }
									}
								}
							}
						},
						orderBy: [{ order: "asc" }, { createdAt: "asc" }]
					}),
					prisma.formField.count({ where: { isActive: true } })
				]);

				const pagination = {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					totalPages: Math.ceil(total / limit)
				};

				return successResponse(formFields, "取得表單欄位成功", pagination);
			} catch (error) {
				console.error("Get form fields error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得表單欄位失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 新增表單欄位
	fastify.post(
		"/form-fields",
		{
			schema: {
				description: "新增表單欄位",
				tags: ["admin-form-fields"],
				body: {
					type: "object",
					required: ["name", "label", "type"],
					properties: {
						name: { type: "string", minLength: 1 },
						label: { type: "string", minLength: 1 },
						type: { 
							type: "string", 
							enum: ["text", "textarea", "email", "radio", "checkbox", "select", "file", "description"] 
						},
						description: { type: "string" },
						required: { type: "boolean", default: false },
						order: { type: "integer", default: 0 },
						options: { type: "array" },
						validation: { type: "object" },
						placeholder: { type: "string" },
						helpText: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									id: { type: "string" },
									name: { type: "string" },
									label: { type: "string" },
									type: { type: "string" },
									description: { type: "string", nullable: true },
									required: { type: "boolean" },
									order: { type: "integer" },
									options: { type: "string", nullable: true },
									validation: { type: "string", nullable: true },
									placeholder: { type: "string", nullable: true },
									helpText: { type: "string", nullable: true },
									isActive: { type: "boolean" },
									createdAt: { type: "string", format: "date-time" },
									updatedAt: { type: "string", format: "date-time" }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { name, label, type, description, required, order, options, validation, placeholder, helpText } = request.body;

				if (!name || !label || !type) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "欄位名稱、標籤和類型為必填");
					return reply.code(statusCode).send(response);
				}

				const validTypes = ["text", "textarea", "email", "radio", "checkbox", "select", "file", "description"];
				if (!validTypes.includes(type)) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "無效的欄位類型");
					return reply.code(statusCode).send(response);
				}

				const formField = await prisma.formField.create({
					data: {
						name,
						label,
						type,
						description,
						required: Boolean(required),
						order: order || 0,
						options: options ? JSON.stringify(options) : null,
						validation: validation ? JSON.stringify(validation) : null,
						placeholder,
						helpText,
						isActive: true
					}
				});

				return successResponse(formField, "新增表單欄位成功");
			} catch (error) {
				console.error("Create form field error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "新增表單欄位失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新表單欄位
	fastify.put(
		"/form-fields/:fieldId",
		{
			schema: {
				description: "更新表單欄位",
				tags: ["admin-form-fields"],
				params: {
					type: "object",
					properties: {
						fieldId: { type: "string" }
					},
					required: ["fieldId"]
				},
				body: {
					type: "object",
					properties: {
						label: { type: "string", minLength: 1 },
						description: { type: "string" },
						required: { type: "boolean" },
						order: { type: "integer" },
						options: { type: "array" },
						validation: { type: "object" },
						placeholder: { type: "string" },
						helpText: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									id: { type: "string" },
									name: { type: "string" },
									label: { type: "string" },
									type: { type: "string" },
									description: { type: "string", nullable: true },
									required: { type: "boolean" },
									order: { type: "integer" },
									options: { type: "string", nullable: true },
									validation: { type: "string", nullable: true },
									placeholder: { type: "string", nullable: true },
									helpText: { type: "string", nullable: true },
									isActive: { type: "boolean" },
									createdAt: { type: "string", format: "date-time" },
									updatedAt: { type: "string", format: "date-time" }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { fieldId } = request.params;
				const { label, description, required, order, options, validation, placeholder, helpText } = request.body;

				const updateData = {};
				if (label !== undefined) updateData.label = label;
				if (description !== undefined) updateData.description = description;
				if (required !== undefined) updateData.required = Boolean(required);
				if (order !== undefined) updateData.order = order;
				if (options !== undefined) updateData.options = options ? JSON.stringify(options) : null;
				if (validation !== undefined) updateData.validation = validation ? JSON.stringify(validation) : null;
				if (placeholder !== undefined) updateData.placeholder = placeholder;
				if (helpText !== undefined) updateData.helpText = helpText;

				updateData.updatedAt = new Date();

				const formField = await prisma.formField.update({
					where: { id: fieldId },
					data: updateData
				});

				return successResponse(formField, "更新表單欄位成功");
			} catch (error) {
				console.error("Update form field error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新表單欄位失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 刪除表單欄位
	fastify.delete(
		"/form-fields/:fieldId",
		{
			schema: {
				description: "刪除表單欄位",
				tags: ["admin-form-fields"],
				params: {
					type: "object",
					properties: {
						fieldId: { type: "string" }
					},
					required: ["fieldId"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									message: { type: "string" }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { fieldId } = request.params;

				await prisma.formField.update({
					where: { id: fieldId },
					data: { isActive: false, updatedAt: new Date() }
				});

				return successResponse({ message: "表單欄位已刪除" });
			} catch (error) {
				console.error("Delete form field error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "刪除表單欄位失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 設定欄位與票種的顯示/必填關係
	fastify.put(
		"/form-fields/:fieldId/ticket-binding",
		{
			schema: {
				description: "設定欄位與票種的顯示/必填關係",
				tags: ["admin-form-fields"],
				params: {
					type: "object",
					properties: {
						fieldId: { type: "string" }
					},
					required: ["fieldId"]
				},
				body: {
					type: "object",
					required: ["ticketBindings"],
					properties: {
						ticketBindings: {
							type: "array",
							items: {
								type: "object",
								required: ["ticketId"],
								properties: {
									ticketId: { type: "string" },
									isVisible: { type: "boolean", default: true },
									isRequired: { type: "boolean", default: false },
									order: { type: "integer", default: 0 }
								}
							}
						}
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string" },
										fieldId: { type: "string" },
										ticketId: { type: "string" },
										isVisible: { type: "boolean" },
										isRequired: { type: "boolean" },
										order: { type: "integer" },
										ticket: {
											type: "object",
											properties: {
												id: { type: "string" },
												name: { type: "string" }
											}
										}
									}
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { fieldId } = request.params;
				const { ticketBindings } = request.body;

				if (!Array.isArray(ticketBindings)) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "票種綁定資料格式錯誤");
					return reply.code(statusCode).send(response);
				}

				// Delete existing bindings
				await prisma.ticketFormField.deleteMany({
					where: { fieldId }
				});

				// Create new bindings
				const bindingsData = ticketBindings.map(binding => ({
					fieldId,
					ticketId: binding.ticketId,
					isVisible: Boolean(binding.isVisible),
					isRequired: Boolean(binding.isRequired),
					order: binding.order || 0
				}));

				await prisma.ticketFormField.createMany({
					data: bindingsData
				});

				// Return updated bindings
				const updatedBindings = await prisma.ticketFormField.findMany({
					where: { fieldId },
					include: {
						ticket: {
							select: { id: true, name: true }
						}
					}
				});

				return successResponse(updatedBindings, "更新欄位票種關係成功");
			} catch (error) {
				console.error("Update ticket binding error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新欄位票種關係失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
