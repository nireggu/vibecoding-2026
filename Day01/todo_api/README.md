# Simple TODO API

Python FastAPI로 만든 아주 간단한 TODO API입니다.

## 기능

- 할 일 목록 조회
- 할 일 추가
- 할 일 완료 상태 변경
- 할 일 삭제
- 데이터는 메모리 리스트에만 저장

## 실행 방법

1. 가상환경 만들기

```powershell
python -m venv venv
```

2. 가상환경 활성화

```powershell
.\\venv\\Scripts\\Activate.ps1
```

3. 필요한 패키지 설치

```powershell
pip install -r requirements.txt
```

4. 서버 실행

```powershell
uvicorn main:app --reload
```

5. 브라우저에서 확인

- API 문서: `http://127.0.0.1:8000/docs`
- 서버 확인: `http://127.0.0.1:8000/`

6. 프론트엔드 연결

- `Day01/todo.html`을 Live Server로 열기
- 보통 `http://127.0.0.1:5500/Day01/todo.html` 형태로 열린다
- 이 화면이 `http://127.0.0.1:8000`의 FastAPI 서버와 통신한다

## 예시 요청

### 할 일 추가

`POST /todos`

```json
{
  "title": "공부하기"
}
```

### 완료 상태 변경

`PATCH /todos/1`

```json
{
  "completed": true
}
```

## 참고

- 이 API는 DB를 사용하지 않아서 서버를 껐다 켜면 데이터가 초기화됩니다.
- 프론트엔드와 API는 서로 다른 포트에서 동작하므로 CORS 설정이 필요합니다.
