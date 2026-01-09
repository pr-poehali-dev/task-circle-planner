import { useState } from 'react';
import { Plus, List, Circle as CircleIcon } from 'lucide-react';
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
};

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Презентация проекта',
      description: 'Подготовить презентацию для инвесторов',
      importance: 9,
      urgency: 8,
      deadline: '2026-01-15',
      subtasks: [
        { id: '1-1', text: 'Создать слайды', completed: true },
        { id: '1-2', text: 'Подготовить речь', completed: false },
        { id: '1-3', text: 'Провести репетицию', completed: false },
      ],
    },
    {
      id: '2',
      title: 'Планирование отпуска',
      description: 'Забронировать билеты и отель',
      importance: 5,
      urgency: 3,
      deadline: '2026-02-01',
      subtasks: [
        { id: '2-1', text: 'Выбрать направление', completed: true },
        { id: '2-2', text: 'Забронировать отель', completed: false },
      ],
    },
    {
      id: '3',
      title: 'Обучение новой технологии',
      description: 'Изучить React и TypeScript',
      importance: 7,
      urgency: 5,
      deadline: '2026-01-30',
      subtasks: [
        { id: '3-1', text: 'Пройти онлайн-курс', completed: false },
        { id: '3-2', text: 'Сделать пет-проект', completed: false },
      ],
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'subtasks'>>({
    title: '',
    description: '',
    importance: 5,
    urgency: 5,
    deadline: '',
  });

  const getCircleSize = (importance: number) => {
    return 60 + importance * 15;
  };

  const getCircleColor = (urgency: number) => {
    const colors = [
      'bg-purple-100 border-purple-200',
      'bg-purple-200 border-purple-300',
      'bg-purple-300 border-purple-400',
      'bg-pink-200 border-pink-300',
      'bg-pink-300 border-pink-400',
      'bg-pink-400 border-pink-500',
      'bg-rose-300 border-rose-400',
      'bg-rose-400 border-rose-500',
      'bg-rose-500 border-rose-600',
      'bg-rose-600 border-rose-700',
    ];
    return colors[urgency - 1] || colors[4];
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleAddTask = () => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      subtasks: [],
    };
    setTasks([...tasks, task]);
    setIsAddDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      importance: 5,
      urgency: 5,
      deadline: '',
    });
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

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
          <div className="flex justify-between items-center mb-6">
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
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 animate-scale-in"
            >
              <Plus className="w-4 h-4" />
              Добавить задачу
            </Button>
          </div>

          <TabsContent value="visual" className="animate-fade-in">
            <Card className="p-8 bg-white/80 backdrop-blur min-h-[600px] relative">
              <div className="flex flex-wrap gap-8 items-center justify-center">
                {tasks.map((task, index) => {
                  const size = getCircleSize(task.importance);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="cursor-pointer transition-all duration-300 hover:scale-110 animate-fade-in"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      <div
                        className={`rounded-full border-4 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow ${getCircleColor(
                          task.urgency
                        )}`}
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                        }}
                      >
                        <div className="text-center p-4">
                          <p className="font-semibold text-sm leading-tight">
                            {task.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="animate-fade-in">
            <div className="space-y-4">
              {tasks.map((task, index) => {
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
                              daysUntil < 7
                                ? 'border-rose-500 text-rose-600'
                                : 'border-primary text-primary'
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
              })}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedTask?.title}</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground">{selectedTask.description}</p>
                </div>
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
                <div>
                  <h4 className="font-semibold mb-3">Подзадачи</h4>
                  <div className="space-y-2">
                    {selectedTask.subtasks.length > 0 ? (
                      selectedTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() =>
                              toggleSubtask(selectedTask.id, subtask.id)
                            }
                          />
                          <span
                            className={
                              subtask.completed
                                ? 'line-through text-muted-foreground'
                                : ''
                            }
                          >
                            {subtask.text}
                          </span>
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
          <DialogContent className="max-w-2xl">
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
