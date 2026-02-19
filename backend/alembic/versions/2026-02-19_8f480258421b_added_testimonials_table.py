"""added testimonials table

Revision ID: 8f480258421b
Revises: 06dbf0d04215
Create Date: 2026-02-19 08:21:24.335091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f480258421b'
down_revision: Union[str, None] = '06dbf0d04215'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('testimonials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('photo', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('place', sa.String(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('status', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_testimonials_id'), 'testimonials', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_testimonials_id'), table_name='testimonials')
    op.drop_table('testimonials')
