import { Hono } from 'hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SSETransport } from 'hono-mcp-server-sse-transport';
import { streamSSE } from 'hono/streaming';
import { serve } from '@hono/node-server';
const app = new Hono();
const mcpServer = new McpServer({ name: 'todo-mcp-server', version: '1.0.0' });
/**
 * addTodoItem
 * @description Todoアイテムを追加する
 * @param title
 * @returns
 */
async function addTodoItem(title) {
    try {
        const response = await fetch('http://localhost:8080/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
            }),
        });
        if (!response.ok) {
            console.error(`[addTodoItem] APIサーバーエラー: ${response.status} ${response.statusText}`);
            return null;
        }
        return response.json();
    }
    catch (e) {
        console.error(`[addTodoItem] APIサーバーとの通信エラー: ${e}`);
        return null;
    }
}
mcpServer.tool('addTodoItem', 'Add a new Todo item', {
    title: z.string().min(1),
}, async ({ title }) => {
    const todoItem = await addTodoItem(title);
    return {
        content: [
            {
                type: 'text',
                text: `${title}を追加しました`,
            },
        ],
    };
});
/**
 * deleteTodoItem
 * @description Todoアイテムを削除する
 * @param id
 * @returns
 */
async function deleteTodoItem(id) {
    try {
        console.log(`[deleteTodoItem]APIサーバーにリクエスト:${id}`);
        const response = await fetch(`http://localhost:8080/todos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            console.error(`[deleteTodoItem] APIサーバーからエラー: ${response.status} ${response.statusText}`);
            return false;
        }
        return true;
    }
    catch (e) {
        console.error(`[deleteTodoItem] APIサーバーとの通信エラー: ${e}`);
        return false;
    }
}
mcpServer.tool('deleteTodoItem', 'Delete a Todo item', {
    id: z.number(),
}, async ({ id }) => {
    const success = deleteTodoItem(id);
    return {
        content: [
            {
                type: 'text',
                text: `${id}を削除しました`,
            },
        ],
    };
});
/**
 * updateTodoItem
 * @description Todoアイテムの完了状態を更新する
 * @param id
 * @param completed
 * @returns
 */
async function updateTodoItem(id, completed) {
    try {
        const response = await fetch(`http://localhost:8080/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Contetn-Type': 'application/json',
            },
            body: JSON.stringify({
                completed,
            }),
        });
        if (!response.ok) {
            console.error(`[updateTodoItem] APIサーバーとの通信エラー: ${response.status} ${response.statusText}`);
            return null;
        }
        return true;
    }
    catch (e) {
        console.error(`[updateTodoItem] APIサーバーとの通信エラー: ${e}`);
        return false;
    }
}
mcpServer.tool('updateTodoItem', 'Update a Todo item', {
    id: z.number(),
    completed: z.boolean(),
}, async ({ id, completed }) => {
    updateTodoItem(id, completed);
    return {
        content: [
            {
                type: 'text',
                text: `${id}の完了状態を更新しました`,
            },
        ],
    };
});
/**
 * SSE
 */
let transports = {};
app.get('/sse', (c) => {
    console.log('[SSE] /sse endpoint accessed');
    return streamSSE(c, async (stream) => {
        try {
            const transport = new SSETransport('/messages', stream);
            console.log(`[SSE] New SSETransport created: sessionId= ${transport.sessionId}`);
            transports[transport.sessionId] = transport;
            stream.onAbort(() => {
                console.log(`[SSE] stream aborted: sessionId= ${transport.sessionId}`);
                delete transports[transport.sessionId];
            });
            await mcpServer.connect(transport);
            console.log(`[SSE] Connected to MCP server: sessionId= ${transport.sessionId}`);
            while (true) {
                await stream.sleep(60000);
            }
        }
        catch (e) {
            console.error(`[SSE] Error creating SSETransport: ${e}`);
        }
    });
});
app.post('/messages', async (c) => {
    const sessionId = c.req.query('sessionId');
    const transport = transports[sessionId ?? ''];
    if (!transport) {
        return c.text('Session not found', 400);
    }
    // mcpServerからのメッセージを受信する
    return transport.handlePostMessage(c);
});
serve({
    fetch: app.fetch,
    port: 3001,
});
console.log('[MCP] Server is running on http://localhost:3001');
