from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="Simple TODO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="할 일 제목")


class TodoUpdate(BaseModel):
    completed: bool = Field(..., description="완료 여부")


class TodoItem(BaseModel):
    id: int
    title: str
    completed: bool


# 메모리에 저장할 할 일 목록
todos: List[TodoItem] = []

# 새 할 일에 붙일 ID
next_id = 1


@app.get("/")
def root() -> dict:
    """서버가 정상 동작하는지 확인하는 기본 경로."""
    return {"message": "TODO API is running"}


@app.get("/todos", response_model=List[TodoItem])
def get_todos() -> List[TodoItem]:
    """할 일 목록 전체를 조회한다."""
    return todos


@app.post("/todos", response_model=TodoItem, status_code=201)
def create_todo(todo: TodoCreate) -> TodoItem:
    """새 할 일을 추가한다."""
    global next_id

    new_todo = TodoItem(id=next_id, title=todo.title, completed=False)
    todos.append(new_todo)
    next_id += 1

    return new_todo


@app.patch("/todos/{todo_id}", response_model=TodoItem)
def update_todo(todo_id: int, payload: TodoUpdate) -> TodoItem:
    """할 일의 완료 상태를 변경한다."""
    for index, todo in enumerate(todos):
        if todo.id == todo_id:
            updated_todo = TodoItem(
                id=todo.id,
                title=todo.title,
                completed=payload.completed,
            )
            todos[index] = updated_todo
            return updated_todo

    raise HTTPException(status_code=404, detail="Todo not found")


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int) -> None:
    """할 일을 삭제한다."""
    for index, todo in enumerate(todos):
        if todo.id == todo_id:
            todos.pop(index)
            return None

    raise HTTPException(status_code=404, detail="Todo not found")
