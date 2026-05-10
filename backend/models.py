from db import engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy import DateTime
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__= "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(15), unique=True)
    email: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now
    )

    solutions = relationship("UserSolution", back_populates="user", cascade="all, delete-orphan")
    custom_problems = relationship("CustomProblem", back_populates="user", cascade="all, delete-orphan")

class Problem(Base):
    __tablename__="problems"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    difficulty: Mapped[str] = mapped_column(String(50))
    url: Mapped[str] = mapped_column(Text)
    sheet_name: Mapped[str] = mapped_column(String(255), index=True)
    topic: Mapped[str] = mapped_column(String(50), nullable=True, default="General")

    solved_by = relationship("UserSolution", back_populates="problem", cascade="all, delete-orphan")

class UserSolution(Base):
    __tablename__ = "user_solutions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    problem_id : Mapped[int] = mapped_column(ForeignKey("problems.id"))
    solved_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="solutions")
    problem = relationship("Problem", back_populates="solved_by")

class CustomProblem(Base):
    __tablename__ = "custom_problems"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    title : Mapped[str] = mapped_column(String(100))
    difficulty : Mapped[str] = mapped_column(String(10))
    url : Mapped[str] = mapped_column(String(255))
    topic : Mapped[str] = mapped_column(String(50))
    source : Mapped[str] = mapped_column(String(20))
    notes : Mapped[str | None] = mapped_column(Text)
    solved_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="custom_problems")