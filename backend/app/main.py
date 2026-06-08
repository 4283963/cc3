from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .api import efficiency, weights, alerts
from .webhooks import gitlab, jira, sonarqube

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="研发团队效能统计系统",
    description="通过 Webhook 整合 GitLab、Jira、SonarQube 数据的研发效能平台",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(efficiency.router, prefix="/api/efficiency", tags=["效能统计"])
app.include_router(weights.router, prefix="/api/weights", tags=["权重配置"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["高危预警"])

app.include_router(gitlab.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(jira.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(sonarqube.router, prefix="/api/webhooks", tags=["Webhooks"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "efficiency-dashboard"}
