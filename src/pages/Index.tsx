import { useState, useEffect, useRef } from 'react';
import { Plus, List, Circle as CircleIcon, Pencil, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  importance: number;
  urgency: number;
  deadline: string;
  subtasks: Subtask[];
  color?: string;
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
};

const STORAGE_KEY = 'planner-tasks';
const GRAVITY = 0.15;
const FRICTION = 0.95;
const BOUNCE = 0.6;

const colorOptions = [
  { name: 'Фиолетовый', value: 'purple', bg: 'bg-purple-300', border: 'border-purple-400' },
  { name: 'Розовый', value: 'pink', bg: 'bg-pink-300', border: 'border-pink-400' },
  { name: 'Персиковый', value: 'peach', bg: 'bg-orange-200', border: 'border-orange-300' },
  { name: 'Голубой', value: 'blue', bg: 'bg-blue-300', border: 'border-blue-400' },
  { name: 'Зелёный', value: 'green', bg: 'bg-green-300', border: 'border-green-400' },
  { name: 'Жёлтый', value: 'yellow', bg: 'bg-yellow-300', border: 'border-yellow-400' },
  { name: 'Красный', value: 'red', bg: 'bg-red-300', border: 'border-red-400' },
];

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'week' | 'month'>('all');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'subtasks'>>({
    title: '',
    description: '',
    importance: 5,
    urgency: 5,
    deadline: '',
    color: 'purple',
  });

  const [newSubtasks, setNewSubtasks] = useState<string[]>(['']);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed.map((task: Task) => ({
          ...task,
          velocity: task.velocity || { x: 0, y: 0 }
        })));
      } catch (e) {
        console.error('Failed to parse saved tasks', e);
      }
    } else {
      setTasks([
        {
          id: '1',
          title: 'Презентация проекта',
          description: 'Подготовить презентацию для инвесторов',
          importance: 9,
          urgency: 8,
          deadline: '2026-01-15',
          color: 'purple',
          subtasks: [
            { id: '1-1', text: 'Создать слайды', completed: true },
            { id: '1-2', text: 'Подготовить речь', completed: false },
            { id: '1-3', text: 'Провести репетицию', completed: false },
          ],
          position: { x: 200, y: 100 },
          velocity: { x: 0, y: 0 },
        },
        {
          id: '2',
          title: 'Планирование отпуска',
          description: 'Забронировать билеты и отель',
          importance: 5,
          urgency: 3,
          deadline: '2026-02-01',
          color: 'pink',
          subtasks: [
            { id: '2-1', text: 'Выбрать направление', completed: true },
            { id: '2-2', text: 'Забронировать отель', completed: false },
          ],
          position: { x: 400, y: 150 },
          velocity: { x: 0, y: 0 },
        },
        {
          id: '3',
          title: 'Обучение новой технологии',
          description: 'Изучить React и TypeScript',
          importance: 7,
          urgency: 5,
          deadline: '2026-01-30',
          color: 'blue',
          subtasks: [
            { id: '3-1', text: 'Пройти онлайн-курс', completed: false },
            { id: '3-2', text: 'Сделать пет-проект', completed: false },
          ],
          position: { x: 600, y: 200 },
          velocity: { x: 0, y: 0 },
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    const animate = () => {
      if (draggedTask) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      setTasks((prevTasks) => {
        const container = containerRef.current;
        if (!container) return prevTasks;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width - 16;
        const containerHeight = containerRect.height - 16;

        const updated = prevTasks.map((task) => {
          const size = getCircleSize(task.importance);
          const radius = size / 2;
          
          const pos = task.position || { x: 100, y: 100 };
          const vel = task.velocity || { x: 0, y: 0 };

          const targetX = containerWidth - size;
          const targetY = containerHeight - size;
          
          const dx = targetX - pos.x;
          const dy = targetY - pos.y;
          
          vel.x += dx > 0 ? GRAVITY : -GRAVITY;
          vel.y += dy > 0 ? GRAVITY : -GRAVITY;

          vel.x *= FRICTION;
          vel.y *= FRICTION;

          pos.x += vel.x;
          pos.y += vel.y;

          if (pos.x < 0) {
            pos.x = 0;
            vel.x *= -BOUNCE;
          }
          if (pos.x > containerWidth - size) {
            pos.x = containerWidth - size;
            vel.x *= -BOUNCE;
          }
          if (pos.y < 0) {
            pos.y = 0;
            vel.y *= -BOUNCE;
          }
          if (pos.y > containerHeight - size) {
            pos.y = containerHeight - size;
            vel.y *= -BOUNCE;
          }

          return {
            ...task,
            position: pos,
            velocity: vel,
          };
        });

        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const task1 = updated[i];
            const task2 = updated[j];

            const size1 = getCircleSize(task1.importance);
            const size2 = getCircleSize(task2.importance);
            const radius1 = size1 / 2;
            const radius2 = size2 / 2;

            const pos1 = task1.position || { x: 0, y: 0 };
            const pos2 = task2.position || { x: 0, y: 0 };

            const center1 = { x: pos1.x + radius1, y: pos1.y + radius1 };
            const center2 = { x: pos2.x + radius2, y: pos2.y + radius2 };

            const dx = center2.x - center1.x;
            const dy = center2.y - center1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = radius1 + radius2;

            if (distance < minDistance && distance > 0) {
              const angle = Math.atan2(dy, dx);
              const overlap = minDistance - distance;

              const moveX = (overlap / 2) * Math.cos(angle);
              const moveY = (overlap / 2) * Math.sin(angle);

              updated[i] = {
                ...task1,
                position: {
                  x: pos1.x - moveX,
                  y: pos1.y - moveY,
                },
                velocity: {
                  x: (task1.velocity?.x || 0) - moveX * 0.5,
                  y: (task1.velocity?.y || 0) - moveY * 0.5,
                },
              };

              updated[j] = {
                ...task2,
                position: {
                  x: pos2.x + moveX,
                  y: pos2.y + moveY,
                },
                velocity: {
                  x: (task2.velocity?.x || 0) + moveX * 0.5,
                  y: (task2.velocity?.y || 0) + moveY * 0.5,
                },
              };
            }
          }
        }

        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draggedTask]);

  const getCircleSize = (importance: number) => {
    return 60 + importance * 15;
  };

  const getCircleColorClasses = (color: string = 'purple', urgency: number) => {
    const colorMap: Record<string, string[]> = {
      purple: [
        'bg-purple-100 border-purple-200',
        'bg-purple-200 border-purple-300',
        'bg-purple-300 border-purple-400',
        'bg-purple-400 border-purple-500',
      ],
      pink: [
        'bg-pink-100 border-pink-200',
        'bg-pink-200 border-pink-300',
        'bg-pink-300 border-pink-400',
        'bg-pink-400 border-pink-500',
      ],
      peach: [
        'bg-orange-100 border-orange-200',
        'bg-orange-200 border-orange-300',
        'bg-orange-300 border-orange-400',
        'bg-orange-400 border-orange-500',
      ],
      blue: [
        'bg-blue-100 border-blue-200',
        'bg-blue-200 border-blue-300',
        'bg-blue-300 border-blue-400',
        'bg-blue-400 border-blue-500',
      ],
      green: [
        'bg-green-100 border-green-200',
        'bg-green-200 border-green-300',
        'bg-green-300 border-green-400',
        'bg-green-400 border-green-500',
      ],
      yellow: [
        'bg-yellow-100 border-yellow-200',
        'bg-yellow-200 border-yellow-300',
        'bg-yellow-300 border-yellow-400',
        'bg-yellow-400 border-yellow-500',
      ],
      red: [
        'bg-red-100 border-red-200',
        'bg-red-200 border-red-300',
        'bg-red-300 border-red-400',
        'bg-red-400 border-red-500',
      ],
    };

    const colors = colorMap[color] || colorMap.purple;
    const index = Math.min(Math.floor(urgency / 3), colors.length - 1);
    return colors[index];
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
    setIsEditMode(false);
  };

  const handleAddTask = () => {
    const subtasks: Subtask[] = newSubtasks
      .filter((text) => text.trim() !== '')
      .map((text, index) => ({
        id: `${Date.now()}-${index}`,
        text: text.trim(),
        completed: false,
      }));

    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      subtasks,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 50 },
      velocity: { x: 0, y: 0 },
    };
    setTasks([...tasks, task]);
    setIsAddDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      importance: 5,
      urgency: 5,
      deadline: '',
      color: 'purple',
    });
    setNewSubtasks(['']);
    toast.success('Задача добавлена!');
  };

  const handleEditTask = () => {
    if (!selectedTask) return;
    
    setTasks(
      tasks.map((task) =>
        task.id === selectedTask.id ? selectedTask : task
      )
    );
    setIsDialogOpen(false);
    setIsEditMode(false);
    toast.success('Задача обновлена!');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    setIsDialogOpen(false);
    toast.success('Задача удалена!');
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : task
      )
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        subtasks: selectedTask.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ),
      });
    }
  };

  const addSubtaskToSelected = () => {
    if (!selectedTask) return;
    const newSubtask: Subtask = {
      id: `${Date.now()}`,
      text: 'Новая подзадача',
      completed: false,
    };
    const updatedTask = {
      ...selectedTask,
      subtasks: [...selectedTask.subtasks, newSubtask],
    };
    setSelectedTask(updatedTask);
  };

  const deleteSubtaskFromSelected = (subtaskId: string) => {
    if (!selectedTask) return;
    const updatedTask = {
      ...selectedTask,
      subtasks: selectedTask.subtasks.filter((st) => st.id !== subtaskId),
    };
    setSelectedTask(updatedTask);
  };

  const updateSubtaskText = (subtaskId: string, text: string) => {
    if (!selectedTask) return;
    setSelectedTask({
      ...selectedTask,
      subtasks: selectedTask.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, text } : st
      ),
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      const daysUntil = getDaysUntilDeadline(task.deadline);
      
      switch (filterType) {
        case 'overdue':
          return daysUntil < 0;
        case 'week':
          return daysUntil >= 0 && daysUntil <= 7;
        case 'month':
          return daysUntil >= 0 && daysUntil <= 30;
        default:
          return true;
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setDraggedTask(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, velocity: { x: 0, y: 0 } }
          : t
      ));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTask || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const task = tasks.find(t => t.id === draggedTask);
    if (!task) return;

    const size = getCircleSize(task.importance);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    setTasks(tasks.map(t => 
      t.id === draggedTask 
        ? { ...t, position: { x, y }, velocity: { x: 0, y: 0 } }
        : t
    ));
  };

  const handleMouseUp = () => {
    setDraggedTask(null);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold text-primary mb-2">Мой планер</h1>
          <p className="text-muted-foreground text-lg">
            Визуализируй задачи и достигай целей
          </p>
        </header>

        <Tabs defaultValue="visual" className="w-full">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <TabsList className="bg-white/80 backdrop-blur">
                <TabsTrigger value="visual" className="gap-2">
                  <CircleIcon className="w-4 h-4" />
                  Визуальный вид
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  Список задач
                </TabsTrigger>
              </TabsList>
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-[200px] bg-white/80 backdrop-blur">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все задачи</SelectItem>
                  <SelectItem value="overdue">Просроченные</SelectItem>
                  <SelectItem value="week">На этой неделе</SelectItem>
                  <SelectItem value="month">В этом месяце</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 animate-scale-in"
            >
              <Plus className="w-4 h-4" />
              Добавить задачу
            </Button>
          </div>

          <TabsContent value="visual" className="animate-fade-in">
            <Card
              ref={containerRef}
              className="p-2 bg-white/80 backdrop-blur min-h-[600px] relative overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const size = getCircleSize(task.importance);
                  const position = task.position || { x: 100, y: 100 };
                  
                  return (
                    <div
                      key={task.id}
                      onMouseDown={(e) => handleMouseDown(e, task.id)}
                      onClick={() => !draggedTask && handleTaskClick(task)}
                      className="absolute cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-xl"
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: `${size}px`,
                        height: `${size}px`,
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-full border-4 flex items-center justify-center shadow-lg ${getCircleColorClasses(
                          task.color,
                          task.urgency
                        )}`}
                      >
                        <div className="text-center p-4">
                          <p className="font-semibold text-sm leading-tight">
                            {task.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-[500px]">
                  <p className="text-muted-foreground text-lg">Нет задач в этом фильтре</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="list" className="animate-fade-in">
            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => {
                  const daysUntil = getDaysUntilDeadline(task.deadline);
                  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
                  return (
                    <Card
                      key={task.id}
                      className="p-6 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer animate-fade-in"
                      onClick={() => handleTaskClick(task)}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{task.title}</h3>
                            <Badge
                              variant="outline"
                              className={
                                daysUntil < 0
                                  ? 'border-rose-600 text-rose-700 bg-rose-50'
                                  : daysUntil < 7
                                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                                  : 'border-primary text-primary bg-purple-50'
                              }
                            >
                              {daysUntil > 0
                                ? `${daysUntil} дн.`
                                : daysUntil === 0
                                ? 'Сегодня'
                                : 'Просрочено'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{task.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Важность: <span className="font-medium">{task.importance}/10</span>
                            </span>
                            <span className="text-muted-foreground">
                              Срочность: <span className="font-medium">{task.urgency}/10</span>
                            </span>
                            <span className="text-muted-foreground">
                              Подзадачи:{' '}
                              <span className="font-medium">
                                {completedSubtasks}/{task.subtasks.length}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-12 bg-white/80 backdrop-blur text-center">
                  <p className="text-muted-foreground text-lg">Нет задач в этом фильтре</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                {isEditMode ? (
                  <Input
                    value={selectedTask?.title || ''}
                    onChange={(e) =>
                      setSelectedTask(selectedTask ? { ...selectedTask, title: e.target.value } : null)
                    }
                    className="text-2xl font-semibold"
                  />
                ) : (
                  <DialogTitle className="text-2xl">{selectedTask?.title}</DialogTitle>
                )}
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <Button variant="outline" size="icon" onClick={() => setIsEditMode(false)}>
                        ✕
                      </Button>
                      <Button size="icon" onClick={handleEditTask}>
                        ✓
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="icon" onClick={() => setIsEditMode(true)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  {isEditMode ? (
                    <Textarea
                      value={selectedTask.description}
                      onChange={(e) =>
                        setSelectedTask({ ...selectedTask, description: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-muted-foreground">{selectedTask.description}</p>
                  )}
                </div>

                {isEditMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Цвет задачи</Label>
                      <div className="flex gap-2 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setSelectedTask({ ...selectedTask, color: color.value })}
                            className={`w-10 h-10 rounded-full border-4 transition-all ${color.bg} ${
                              selectedTask.color === color.value
                                ? 'border-primary scale-110'
                                : 'border-gray-300 hover:scale-105'
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Дедлайн</Label>
                      <Input
                        type="date"
                        value={selectedTask.deadline}
                        onChange={(e) =>
                          setSelectedTask({ ...selectedTask, deadline: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Важность: {selectedTask.importance}/10</Label>
                      <Slider
                        value={[selectedTask.importance]}
                        onValueChange={(value) =>
                          setSelectedTask({ ...selectedTask, importance: value[0] })
                        }
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Срочность: {selectedTask.urgency}/10</Label>
                      <Slider
                        value={[selectedTask.urgency]}
                        onValueChange={(value) =>
                          setSelectedTask({ ...selectedTask, urgency: value[0] })
                        }
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Дедлайн:</span>{' '}
                      {new Date(selectedTask.deadline).toLocaleDateString('ru-RU')}
                    </div>
                    <div>
                      <span className="font-medium">Важность:</span> {selectedTask.importance}/10
                    </div>
                    <div>
                      <span className="font-medium">Срочность:</span> {selectedTask.urgency}/10
                    </div>
                    <div>
                      <span className="font-medium">Осталось дней:</span>{' '}
                      {getDaysUntilDeadline(selectedTask.deadline)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Подзадачи</h4>
                    {isEditMode && (
                      <Button variant="outline" size="sm" onClick={addSubtaskToSelected}>
                        <Plus className="w-4 h-4 mr-1" />
                        Добавить
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedTask.subtasks.length > 0 ? (
                      selectedTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() =>
                              toggleSubtask(selectedTask.id, subtask.id)
                            }
                            disabled={isEditMode}
                          />
                          {isEditMode ? (
                            <>
                              <Input
                                value={subtask.text}
                                onChange={(e) => updateSubtaskText(subtask.id, e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSubtaskFromSelected(subtask.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <span
                              className={
                                subtask.completed
                                  ? 'line-through text-muted-foreground'
                                  : ''
                              }
                            >
                              {subtask.text}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Подзадач пока нет</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Новая задача</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Название задачи</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Например: Подготовить отчет"
                />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Подробности задачи..."
                />
              </div>
              <div>
                <Label>Цвет задачи</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewTask({ ...newTask, color: color.value })}
                      className={`w-10 h-10 rounded-full border-4 transition-all ${color.bg} ${
                        newTask.color === color.value
                          ? 'border-primary scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Дедлайн</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>
              <div>
                <Label>Важность: {newTask.importance}/10</Label>
                <Slider
                  value={[newTask.importance]}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, importance: value[0] })
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Срочность: {newTask.urgency}/10</Label>
                <Slider
                  value={[newTask.urgency]}
                  onValueChange={(value) => setNewTask({ ...newTask, urgency: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Подзадачи (опционально)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewSubtasks([...newSubtasks, ''])}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Добавить
                  </Button>
                </div>
                <div className="space-y-2">
                  {newSubtasks.map((subtask, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={subtask}
                        onChange={(e) => {
                          const updated = [...newSubtasks];
                          updated[index] = e.target.value;
                          setNewSubtasks(updated);
                        }}
                        placeholder={`Подзадача ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNewSubtasks(newSubtasks.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAddTask}
                className="w-full"
                disabled={!newTask.title || !newTask.deadline}
              >
                Добавить задачу
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;