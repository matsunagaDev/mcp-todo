'use client';
import { useQuery } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bot, CheckCircle2, Plus, Send, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};
const getTodos = async () => {
  const res = await fetch('http://localhost:8080/todos');
  return res.json();
};
export default function Home() {
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  }) as { data: Todo[] | undefined };

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: 'api/chat',
      experimental_throttle: 50,
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent py-2">
          チャットTODOアプリ
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="h-[calc(100vh-150px)] flex flex-col md:col-span-3 shadow-lg border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-white dark:bg-slate-950 rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                <span>TODOアシスタント</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4 h-[calc(100%-80px)]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          'flex items-center gap-2',
                          message.role === 'user'
                            ? 'flex-row-reverse'
                            : 'flex-row'
                        )}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-slate-700'
                          )}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex w-full">
                            <div
                              className={cn(
                                'p-3 rounded-2xl max-w-full md:max-w-[90%] min-w-0 break-words relative',
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white ml-auto rounded-tr-none'
                                  : 'bg-gray-200 dark:bg-slate-700 dark:text-slate-100 rounded-tl-none'
                              )}
                            >
                              <p className="whitespace-pre-line break-words">
                                {message.content}
                              </p>
                            </div>
                          </div>
                          <div
                            className={cn(
                              'text-xs mt-1 text-gray-500 dark:text-gray-400',
                              message.role === 'user'
                                ? 'text-right'
                                : 'text-left'
                            )}
                          >
                            {message.createdAt
                              ? formatTime(message.createdAt?.toString() ?? '')
                              : ''}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <CardFooter className="p-3 border-t bg-white dark:bg-slate-950">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 w-full"
                >
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="メッセージを入力..."
                    className="rounded-full border-gray-300 dark:border-gray-700 focus-visible:ring-blue-500"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </CardContent>
          </Card>
          {/* TODO部分 */}
          <Card className="h-[calc(100vh-150px)] flex flex-col md:col-span-2 shadow-lg border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-white dark:bg-slate-950 rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <span>TODOリスト</span>
                <Badge variant="outline" className="ml-2">
                  {query.data ? query.data.length : 0} 件
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                チャットからのみ操作可能です
              </p>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100%-80px)] p-4">
                {!query.data || query.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p>TODOがありません</p>
                    <p className="text-sm">
                      チャットで「TODO 追加:
                      タスク名」と入力してTODOを追加してください。
                    </p>
                    <Badge variant="secondary" className="mt-4">
                      チャットからのみ操作可能
                    </Badge>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    <AnimatePresence>
                      {query.data.map((todo) => (
                        <motion.li
                          key={todo.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={cn(
                                'rounded-full p-0 h-6 w-6 flex items-center justify-center',
                                todo.completed
                                  ? 'text-green-500'
                                  : 'text-gray-400'
                              )}
                            >
                              {todo.completed ? (
                                <CheckCircle2 className="h-5 w-5 fill-green-100" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                              )}
                            </div>
                            <span
                              className={cn(
                                'font-medium',
                                todo.completed &&
                                  'line-through text-muted-foreground'
                              )}
                            >
                              {todo.title}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-50 dark:bg-slate-900"
                            >
                              ID: {String(todo.id).slice(-4)}
                            </Badge>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
