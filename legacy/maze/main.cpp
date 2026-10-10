#include <GL/freeglut.h>  
#include <iostream>
#include <vector>

int windowWidth = 600, windowHeight = 600;
const char* studentID = "412402311";

const int MAZE_SIZE = 10;
int maze[MAZE_SIZE][MAZE_SIZE] = {
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 0},  // 出口在 [0][9] 設為通道 0
    {1, 0, 0, 0, 1, 0, 0, 0, 0, 0},
    {1, 0, 1, 0, 1, 0, 1, 1, 0, 1},
    {1, 0, 1, 0, 0, 0, 1, 1, 0, 1},
    {1, 1, 1, 1, 1, 0, 0, 1, 0, 1},
    {1, 0, 0, 0, 1, 0, 0, 0, 0, 1},
    {1, 1, 1, 0, 0, 0, 1, 0, 1, 1},
    {1, 0, 1, 0, 1, 0, 1, 0, 1, 1},
    {1, 0, 0, 0, 1, 0, 0, 0, 0, 1},
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1}
};
const float cellSize = 0.8;
const float offsetX = 1.0;
const float offsetY = 1.5;
const float studentIDOffset = 1.5;

int initialMaze[MAZE_SIZE][MAZE_SIZE];

int entranceX = -1, entranceY = -1;  
bool setEntranceMode = false; 

bool visited[MAZE_SIZE][MAZE_SIZE] = { false }; 
std::vector<std::pair<int, int>> path; // 保存走過的路徑
bool pathFound = true; // 初始假設路徑可找到
const char* statusMessage = ""; // 儲存顯示的訊息

bool dfs(int x, int y) {
                                                                          // 邊界檢查
    if (x < 0 || x >= MAZE_SIZE || y < 0 || y >= MAZE_SIZE) return false; // 遇到牆壁或已訪問過的格子
    if (maze[y][x] == 1 || visited[y][x]) return false;
    visited[y][x] = true; // 標記該格子已經訪問過
    path.emplace_back(x, y); // 將當前位置加入路徑

    if (y == 0 && x == 9) return true; // 如果到達出口，返回 true

    if (dfs(x + 1, y) || dfs(x, y + 1) || dfs(x - 1, y) || dfs(x, y - 1)) return true; // 嘗試向四個方向進行深度優先搜尋

    path.pop_back(); // 如果四個方向都無法走通，則回溯
    return false;
}

int mouseX = -1, mouseY = -1;
bool animationRunning = false;
std::vector<std::pair<int, int>> animationPath; // 儲存老鼠動畫的路徑
size_t animationStep = 0; // 動畫步驟計數器
bool animationCompleted = false;

void updateAnimation(int value) {
    if (!animationRunning || animationStep >= animationPath.size()) {
        animationRunning = false; 
        animationCompleted = true; 
        glutPostRedisplay();
        return;
    }

    mouseX = animationPath[animationStep].first;
    mouseY = animationPath[animationStep].second;

    std::cout << "(" << mouseX << ", " << mouseY << ")" << std::endl;

    animationStep++;

    glutPostRedisplay(); 
    glutTimerFunc(200, updateAnimation, 0); // 設置下一步動畫延遲
}


void startDFSWithAnimation() {
    if (entranceX == -1 || entranceY == -1) {
        statusMessage = "Please set an entrance first!";
        glutPostRedisplay();
        return;
    }

    std::fill(&visited[0][0], &visited[0][0] + MAZE_SIZE * MAZE_SIZE, false);
    path.clear();
    animationCompleted = false; 

    if (dfs(entranceX, entranceY)) {
        animationPath = path; 
        animationRunning = true; 
        std::cout << "Mouse moved to position:\n";
        animationStep = 0;
        glutTimerFunc(200, updateAnimation, 0); // 設置初始動畫延遲
    }
    else {
        pathFound = false;
        statusMessage = "No path found from entrance to exit!";
        glutPostRedisplay();
    }
}

void copyMaze(int src[MAZE_SIZE][MAZE_SIZE], int dest[MAZE_SIZE][MAZE_SIZE]) {
    for (int i = 0; i < MAZE_SIZE; i++) {
        for (int j = 0; j < MAZE_SIZE; j++) {
            dest[i][j] = src[i][j];
        }
    }
}

void displayMaze() {
    for (int i = 0; i < MAZE_SIZE; i++) {
        for (int j = 0; j < MAZE_SIZE; j++) {
            float x = offsetX + j * cellSize;
            float y = offsetY + i * cellSize;

            if (maze[i][j] == 1) {
                glColor3f(0.698, 0.784, 0.733);  // 牆壁
            }
            else if (i == entranceY && j == entranceX) {
                glColor3f(0.447, 0.325, 0.204);  // 入口
            }
            else if (i == 0 && j == 9) {
                glColor3f(0.447, 0.325, 0.204);  // 出口
            }
            else {
                glColor3f(1.0, 0.961, 0.969);  // 通道
            }

            glBegin(GL_QUADS);
            glVertex2f(x, y);
            glVertex2f(x + cellSize, y);
            glVertex2f(x + cellSize, y + cellSize);
            glVertex2f(x, y + cellSize);
            glEnd();

            glColor3f(0.0, 0.0, 0.0);  // 設定顏色為黑色（格線顏色）
            glBegin(GL_LINE_LOOP);
            glVertex2f(x, y);
            glVertex2f(x + cellSize, y);
            glVertex2f(x + cellSize, y + cellSize);
            glVertex2f(x, y + cellSize);
            glEnd();
        }
    }

    if (animationCompleted) {
        glColor3f(0.271, 0.475, 0.290); // 路徑
        for (const auto& p : animationPath) {
            float x = offsetX + p.first * cellSize;
            float y = offsetY + p.second * cellSize;

            glBegin(GL_QUADS);
            glVertex2f(x, y);
            glVertex2f(x + cellSize, y);
            glVertex2f(x + cellSize, y + cellSize);
            glVertex2f(x, y + cellSize);
            glEnd();
        }
    }

    if (mouseX != -1 && mouseY != -1) {
        glColor3f(0.271, 0.475, 0.290); // 老鼠
        float x = offsetX + mouseX * cellSize;
        float y = offsetY + mouseY * cellSize;

        glBegin(GL_QUADS);
        glVertex2f(x, y);
        glVertex2f(x + cellSize, y);
        glVertex2f(x + cellSize, y + cellSize);
        glVertex2f(x, y + cellSize);
        glEnd();
    }
}

void mouseClick(int button, int state, int x, int y) {
    if (button == GLUT_LEFT_BUTTON && state == GLUT_DOWN) {
        float worldX = (float)x / windowWidth * MAZE_SIZE;
        float worldY = (float)(windowHeight - y) / windowHeight * (MAZE_SIZE + studentIDOffset);
        int col = (worldX - offsetX) / cellSize;
        int row = (worldY - offsetY) / cellSize;

        if (col == 9 && row == 0) {
            std::cout << "The exit position cannot be changed.\n";
            statusMessage = "The exit position cannot be changed.";
            return;
        }
        if (col == entranceX && row == entranceY) {
            std::cout << "Entrance selected on (" << entranceX << ", " << entranceY << "), please choose another location.\n";
            statusMessage = "Entrance selected, please choose another location.";
            return;
        }

        if (col >= 0 && col < MAZE_SIZE && row >= 0 && row < MAZE_SIZE) {
            if (setEntranceMode) {
                if (maze[row][col] == 0) {
                    entranceX = col;
                    entranceY = row;
                    std::cout << "The entrance is set at (" << entranceX << ", " << entranceY << ")\n";
                }
                else {
                    std::cout << "The entrance can only be located in the passage position!\n";
                    statusMessage = "The entrance can only be located in the passage position!";
                }
            }
            else {
                if (col != entranceX || row != entranceY) {
                    maze[row][col] = 1 - maze[row][col];  
                }
            }
            glutPostRedisplay();
        }
        else {
            std::cout << "Beyond the maze boundary!\n";
            statusMessage = "Beyond the maze boundary!";
        }
    }
}


void toggleEntranceMode() {
    setEntranceMode = !setEntranceMode;
    if (setEntranceMode) {
        printf("Entrance mode on.\n");
        statusMessage = "Entrance mode on.";
    }
    else {
        printf("Entrance mode off.\n");
        statusMessage = "Entrance mode off.";
    }
    glutPostRedisplay(); 
}

void resetMaze() {
    copyMaze(initialMaze, maze); 
    std::fill(&visited[0][0], &visited[0][0] + MAZE_SIZE * MAZE_SIZE, false); // 重置訪問陣列

    entranceX = -1;
    entranceY = -1;

    mouseX = -1;
    mouseY = -1;

    path.clear();
    animationPath.clear();
    animationRunning = false;
    animationCompleted = false;
    animationStep = 0;

    statusMessage = "Maze reset!";

    glutPostRedisplay();

    std::cout << "Maze reset!\n";
}


void EntranceMode(int option) {
    toggleEntranceMode(); 
}

void createMenu() {
    int menu = glutCreateMenu([](int option) {
        switch (option) {
        case 1:
            EntranceMode(option); 
            break;
        case 2:
            startDFSWithAnimation(); // 呼叫 startDFS() 開始尋路
            break;
        case 3:
            resetMaze();
            break;
        default:
            break;
        }
        });

    glutAddMenuEntry("Entrance Mode/Wall", 1);
    glutAddMenuEntry("Start Walk (DFS)", 2);
    glutAddMenuEntry("Reset Maze", 3);

    glutAttachMenu(GLUT_RIGHT_BUTTON);
}

void drawStudentID() {
    glColor3f(0.271, 0.537, 0.733);
    float textX = offsetX + MAZE_SIZE * cellSize / 2 - 0.5;  
    float textY = MAZE_SIZE + 0.2;
    glRasterPos2i(textX, textY);
    for (const char* c = studentID; *c != '\0'; c++) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, *c);
    }
}

void drawStatusMessage() {
    glColor3f(0.271, 0.537, 0.580);  
    float textX = offsetX + MAZE_SIZE * cellSize / 2 - 2.5;  
    float textY = MAZE_SIZE - 9; 
    glRasterPos2i(textX, textY);

    for (const char* c = statusMessage; *c != '\0'; c++) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, *c);
    }
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    displayMaze();       
    drawStudentID();    
    drawStatusMessage(); //設定位圖或像素繪製的起始位置
    glFlush(); //強制執行任何已經提交但尚未完成的 OpenGL 命令
}

void initOpenGL() {
    glClearColor(1.0, 1.0, 1.0, 1.0);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(0.0, MAZE_SIZE, 0.0, MAZE_SIZE + studentIDOffset, -1.0, 1.0);
    glMatrixMode(GL_MODELVIEW);
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(windowWidth, windowHeight);
    glutCreateWindow("老鼠走迷宮");
    initOpenGL();

    copyMaze(maze, initialMaze);

    createMenu();

    glutDisplayFunc(display);
    glutMouseFunc(mouseClick);

    glutMainLoop();
    return 0;
}
