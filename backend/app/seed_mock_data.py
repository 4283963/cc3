"""
Mock 数据生成脚本
用于在没有真实数据源时生成演示数据
运行方式: python -m app.seed_mock_data
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .database import SessionLocal, engine, Base
from . import models, crud


def seed_mock_data():
    db = SessionLocal()
    
    try:
        Base.metadata.create_all(bind=engine)
        
        team_members = [
            {"username": "zhangsan", "display_name": "张三", "email": "zhangsan@example.com", "department": "后端组"},
            {"username": "lisi", "display_name": "李四", "email": "lisi@example.com", "department": "后端组"},
            {"username": "wangwu", "display_name": "王五", "email": "wangwu@example.com", "department": "前端组"},
            {"username": "zhaoliu", "display_name": "赵六", "email": "zhaoliu@example.com", "department": "前端组"},
            {"username": "qianqi", "display_name": "钱七", "email": "qianqi@example.com", "department": "测试组"},
            {"username": "sunba", "display_name": "孙八", "email": "sunba@example.com", "department": "算法组"},
            {"username": "zhoujiu", "display_name": "周九", "email": "zhoujiu@example.com", "department": "后端组"},
            {"username": "wushi", "display_name": "吴十", "email": "wushi@example.com", "department": "前端组"},
        ]
        
        users = []
        for member in team_members:
            user = crud.get_or_create_user(db, member["username"], member["display_name"], member["email"])
            user.department = member["department"]
            user.avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={member['username']}"
            db.commit()
            db.refresh(user)
            users.append(user)
        
        repos = ["backend-core", "frontend-web", "mobile-app", "data-platform", "infrastructure"]
        
        now = datetime.utcnow()
        for day in range(60):
            date = now - timedelta(days=day)
            
            for user in users:
                if random.random() > 0.3:
                    num_commits = random.randint(0, 5)
                    for i in range(num_commits):
                        additions = random.randint(10, 300)
                        deletions = random.randint(5, 100)
                        commit_time = date.replace(
                            hour=random.randint(9, 18),
                            minute=random.randint(0, 59)
                        )
                        
                        commit = models.CodeCommit(
                            commit_sha=f"mock_{user.id}_{day}_{i}_{random.randint(10000, 99999)}",
                            message=f"feat: 完成功能模块 #{random.randint(100, 999)}",
                            additions=additions,
                            deletions=deletions,
                            total_lines=additions + deletions,
                            branch="main",
                            repo_name=random.choice(repos),
                            commit_url=f"https://gitlab.example.com/repo/commit/{random.randint(1000, 9999)}",
                            committed_at=commit_time,
                            author_id=user.id
                        )
                        db.add(commit)
        
        bug_count = 0
        story_count = 0
        for user in users:
            num_issues = random.randint(5, 20)
            for i in range(num_issues):
                is_bug = random.random() < 0.3
                issue_type = "Bug" if is_bug else "Story"
                
                statuses = ["To Do", "In Progress", "Done", "In Review"]
                status = random.choice(statuses)
                is_done = status == "Done"
                
                story_points = 0
                if not is_bug:
                    story_points = random.choice([1, 2, 3, 5, 8, 13])
                
                created_date = now - timedelta(days=random.randint(1, 45))
                resolved_at = None
                if is_done:
                    resolved_at = created_date + timedelta(days=random.randint(1, 10))
                
                issue = models.JiraIssue(
                    issue_key=f"DEV-{1000 + story_count + bug_count}",
                    title=f"{'修复' if is_bug else '开发'}: {random.choice(['用户模块', '订单系统', '支付功能', '消息推送', '数据分析', '权限管理', '日志系统', '监控告警'])}相关问题",
                    issue_type=issue_type,
                    status=status,
                    priority=random.choice(["High", "Medium", "Low"]),
                    story_points=float(story_points),
                    is_bug=is_bug,
                    created_at=created_date,
                    resolved_at=resolved_at,
                    assignee_id=user.id
                )
                db.add(issue)
                if is_bug:
                    bug_count += 1
                else:
                    story_count += 1
        
        sonar_types = ["BUG", "CODE_SMELL", "VULNERABILITY"]
        sonar_severities = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"]
        
        for user in users:
            num_issues = random.randint(2, 15)
            for i in range(num_issues):
                issue_type = random.choice(sonar_types)
                resolved = random.random() > 0.6
                
                created_date = now - timedelta(days=random.randint(1, 30))
                resolved_at = None
                if resolved:
                    resolved_at = created_date + timedelta(days=random.randint(1, 7))
                
                issue = models.SonarIssue(
                    sonar_key=f"sonar-{user.id}-{i}-{random.randint(10000, 99999)}",
                    severity=random.choice(sonar_severities),
                    type=issue_type,
                    message=random.choice([
                        "方法复杂度超过阈值",
                        "存在未处理的异常",
                        "变量命名不符合规范",
                        "SQL 注入风险",
                        "缺少单元测试覆盖",
                        "重复代码检测",
                        "内存泄漏风险",
                        "未使用的 import"
                    ]),
                    component=f"src/main/java/com/example/{random.choice(['service', 'controller', 'repository', 'util'])}/SomeClass.java",
                    project=random.choice(repos),
                    is_new=random.random() > 0.7,
                    resolved=resolved,
                    created_at=created_date,
                    resolved_at=resolved_at,
                    assignee_id=user.id
                )
                db.add(issue)
        
        crud.get_default_weight_config(db)
        
        db.commit()
        print(f"Mock 数据生成完成!")
        print(f"- 用户: {len(users)} 人")
        print(f"- 代码提交: ~{len(users) * 40 * 0.7 * 3} 条")
        print(f"- Jira 任务: {story_count + bug_count} 个 (故事: {story_count}, Bug: {bug_count})")
        print(f"- Sonar 问题: ~{len(users) * 8} 个")
        
    except Exception as e:
        db.rollback()
        print(f"生成数据出错: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_mock_data()
