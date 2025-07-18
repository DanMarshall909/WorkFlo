import { TaskService } from '../../services/implementations/task.service';
import { IApiService } from '../../services/container';

// Mock API service for testing
const mockApiService: jest.Mocked<IApiService> = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService(mockApiService);
    jest.clearAllMocks();
  });

  describe('Task Management', () => {
    describe('viewing tasks', () => {
      it('user can view their task list', async () => {
        // Arrange
        const mockTasks = [
          { id: '1', title: 'Test Task 1', completed: false },
          { id: '2', title: 'Test Task 2', completed: true },
        ];
        mockApiService.get.mockResolvedValue({ data: mockTasks });

        // Act
        const result = await taskService.getTasks();

        // Assert
        // Business Rule: User can access their personal task list
        expect(mockApiService.get).toHaveBeenCalledWith('/tasks');
        expect(result).toEqual(mockTasks);
      });

      describe('when system is unavailable', () => {
        it('user sees empty state when tasks unavailable', async () => {
          // Arrange
          mockApiService.get.mockRejectedValue(new Error('Network error'));

          // Act
          const result = await taskService.getTasks();

          // Assert
          // Business Rule: User experience remains functional when data unavailable
          expect(result).toEqual([]);
          expect(mockApiService.get).toHaveBeenCalledWith('/tasks');
        });
      });
    });
  });
});