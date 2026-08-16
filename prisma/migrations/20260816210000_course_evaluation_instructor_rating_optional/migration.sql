-- A nota única de "qualidade dos instrutores" saiu do formulário: cada docente
-- passou a ser avaliado individualmente na InstructorEvaluation. As respostas
-- antigas continuam com o valor que tinham.
ALTER TABLE "CourseEvaluation" ALTER COLUMN "instructorRating" DROP NOT NULL;
