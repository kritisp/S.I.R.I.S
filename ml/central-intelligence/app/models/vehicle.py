import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, GUID

if TYPE_CHECKING:
    from app.models.case import Case


class VehicleRole(str, enum.Enum):
    SUSPECT_VEHICLE = "SUSPECT_VEHICLE"
    STOLEN_VEHICLE = "STOLEN_VEHICLE"
    RECOVERED_VEHICLE = "RECOVERED_VEHICLE"
    VICTIM_VEHICLE = "VICTIM_VEHICLE"
    OTHER = "OTHER"


class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4
    )
    registration_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    make: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)




from sqlalchemy import cast

class CaseVehicle(Base):
    __tablename__ = "case_vehicles"

    case_id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
        index=True
    )
    vehicle_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID,
        nullable=True
    )
    vehicle: Mapped[str] = mapped_column(
        String(100),
        primary_key=True
    )
    role: Mapped[Optional[VehicleRole]] = mapped_column(
        Enum(VehicleRole),
        nullable=True
    )

    # Relationships
    case: Mapped["Case"] = relationship(
        "Case",
        primaryjoin="cast(Case.id, String) == CaseVehicle.case_id",
        foreign_keys=[case_id],
        back_populates="vehicle_associations"
    )
