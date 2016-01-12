package models

import play.api.libs.json._
import org.joda.time.DateTime
import play.api.libs.functional.syntax._

case class Commit(message: String, author: Author, date: DateTime, sha: String)

object Commit {

  implicit val yourJodaDateReads = Reads.jodaDateReads("yyyy-MM-dd'T'HH:mm:ss'Z'")
  implicit val yourJodaDateWrites = Writes.jodaDateWrites("yyyy-MM-dd'T'HH:mm:ss'Z'")

  implicit val commitReader = (
    (__ \ "commit" \ "message").read[String] and
    (__).read[Author](Author.authorReaderFromCommit) and
    (__ \ "commit" \ "author" \ "date").read[DateTime] and
    (__ \ "sha").read[String]
  )(Commit.apply _)

  implicit val commitToJson = Json.writes[Commit]

}
