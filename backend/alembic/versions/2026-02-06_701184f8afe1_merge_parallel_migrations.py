"""merge parallel migrations

Revision ID: 701184f8afe1
Revises: 852f9b79688f, d033355e3740
Create Date: 2026-02-06 09:58:03.132579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '701184f8afe1'
down_revision: Union[str, None] = ('852f9b79688f', 'd033355e3740')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
