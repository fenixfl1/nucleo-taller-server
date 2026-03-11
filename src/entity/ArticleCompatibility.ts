import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import { Article } from './Article'

@Entity({ name: 'ARTICLE_COMPATIBILITY' })
@Index('IDX_ARTICLE_COMPATIBILITY_ARTICLE', ['ARTICLE_ID'])
export class ArticleCompatibility extends BaseEntity {
  @PrimaryGeneratedColumn()
  ARTICLE_COMPATIBILITY_ID: number

  @Column({ type: 'integer', nullable: false })
  ARTICLE_ID: number

  @Column({ type: 'varchar', length: 60, nullable: false })
  BRAND: string

  @Column({ type: 'varchar', length: 80, nullable: false })
  MODEL: string

  @Column({ type: 'integer', nullable: true })
  YEAR_FROM: number | null

  @Column({ type: 'integer', nullable: true })
  YEAR_TO: number | null

  @Column({ type: 'varchar', length: 60, nullable: true })
  ENGINE: string | null

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOTES: string | null

  @ManyToOne(() => Article, (article) => article.COMPATIBILITIES, {
    nullable: false,
  })
  @JoinColumn({ name: 'ARTICLE_ID' })
  ARTICLE: Article
}
